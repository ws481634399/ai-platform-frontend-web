<template>
  <StateView :loading="loading" :error="error" :is-empty="notFound" @retry="load">
    <template #empty>
      <div class="not-found">
        <h2 class="not-found__title">商品不存在</h2>
        <p class="not-found__text">该商品可能已下架或链接有误。</p>
        <router-link to="/products" class="not-found__action"> 返回商品列表 </router-link>
      </div>
    </template>
    <template #default>
      <div v-if="detail" class="product-detail">
        <nav class="breadcrumb" aria-label="面包屑">
          <router-link to="/"> 首页 </router-link>
          <span v-for="node in detail.categoryPath" :key="node.id">
            <span class="breadcrumb__sep">/</span>
            <router-link :to="`/products?categoryId=${node.id}`">{{ node.name }}</router-link>
          </span>
        </nav>

        <div class="detail-main">
          <div class="gallery">
            <div class="gallery__main">
              <img :src="activeImage" :alt="detail.productName" @error="onImageError" />
            </div>
            <div v-if="detail.images.length" class="gallery__thumbs">
              <button
                v-for="img in detail.images"
                :key="img.id"
                type="button"
                class="gallery__thumb"
                :class="{ active: img.imageUrl === activeImage }"
                @click="activeImage = img.imageUrl"
              >
                <img :src="img.imageUrl" :alt="detail.productName" />
              </button>
            </div>
          </div>

          <div class="info">
            <h1 class="info__name">
              {{ detail.productName }}
            </h1>
            <p v-if="detail.subtitle" class="info__subtitle">
              {{ detail.subtitle }}
            </p>
            <p v-if="detail.brandName" class="info__brand">
              品牌 · <span class="info__brand-name">{{ detail.brandName }}</span>
            </p>

            <div class="info__price-row">
              <div class="info__price-block">
                <span class="info__price-label">价格</span>
                <PriceText :value="currentPrice" class="info__price-value" />
              </div>
              <StockBadge
                v-if="currentSku"
                :status="stockStatusOf(currentSku.skuId)"
                @retry="retryUnknown"
              />
            </div>

            <SkuSelector
              v-if="detail.specDimensions.length"
              :dimensions="detail.specDimensions"
              :sku-index="detail.skuIndex"
              :dimensions-order="detail.dimensionsOrder"
              @change="onSkuChange"
            />

            <div class="info__actions">
              <button
                type="button"
                class="action-btn action-btn--ghost"
                data-testid="add-cart-btn"
                :disabled="!canAddToCart || guestCartBlocked"
                @click="addToCart"
              >
                加入购物车
              </button>
              <button
                type="button"
                class="action-btn action-btn--primary"
                :disabled="!canAddToCart"
                data-testid="buy-now-btn"
                @click="buyNow"
              >
                立即购买
              </button>
              <transition name="fade">
                <span
                  v-if="addMessage"
                  class="info__add-message"
                  :class="{ 'info__add-message--warn': addMessageWarn }"
                  data-testid="add-cart-message"
                  >{{ addMessage }}</span
                >
              </transition>
            </div>
            <!-- FE-504：游客购物车关闭时禁用加购并引导登录（会员车不受影响） -->
            <p
              v-if="guestCartBlocked"
              class="info__guest-hint"
              data-testid="guest-cart-blocked-hint"
            >
              游客购物车暂未开放，
              <router-link
                :to="{ path: '/login', query: { redirect: route.fullPath } }"
                class="info__guest-hint-link"
              >
                请登录后加购
              </router-link>
            </p>
          </div>
        </div>

        <section v-if="detail.description" class="description">
          <h3 class="description__title">商品详情</h3>
          <div class="rich-text" v-html="sanitizedDescription" />
        </section>
      </div>
    </template>
  </StateView>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DOMPurify from 'dompurify'
import { catalogApi, type ProductDetail, type SkuIndexEntry, type StockStatus } from '@/api/catalog'
import { resolveErrorMessage } from '@/utils/http-error'
import StateView from '@/components/StateView.vue'
import PriceText from '@/components/PriceText.vue'
import SkuSelector from '@/components/SkuSelector.vue'
import StockBadge from '@/components/StockBadge.vue'
import { useCartStore } from '@/stores/cart'
import { useCheckoutStore } from '@/stores/checkout'
import { useMemberStore } from '@/stores/member'
import { useFeaturesStore } from '@/stores/features'

const cart = useCartStore()
const checkout = useCheckoutStore()
const member = useMemberStore()
const features = useFeaturesStore()
const router = useRouter()

/** 类型守卫：判断错误是否带有 response.status（兼容 axios 错误与 mock 抛出的普通对象） */
function hasResponseStatus(e: unknown): e is { response?: { status?: number } } {
  return typeof e === 'object' && e !== null && 'response' in e
}

const route = useRoute()
const detail = ref<ProductDetail | null>(null)
const loading = ref(true)
const error = ref('')
const notFound = ref(false)
const addMessage = ref('')
const addMessageWarn = ref(false)
const activeImage = ref<string>('')
const currentSku = ref<SkuIndexEntry | null>(null)
const stockMap = ref<Record<string, StockStatus>>({})

const currentPrice = computed(() => {
  if (currentSku.value) return currentSku.value.priceFen
  // 未选齐时取价区：所有启用 SKU 最低价
  const entries = Object.values(detail.value?.skuIndex ?? {})
  if (!entries.length) return 0
  return Math.min(...entries.map((e) => e.priceFen))
})

const sanitizedDescription = computed(() =>
  detail.value?.description ? DOMPurify.sanitize(detail.value.description) : '',
)

const canAddToCart = computed(() => {
  if (!currentSku.value) return false
  const st = stockStatusOf(currentSku.value.skuId)
  return st === 'IN_STOCK' || st === 'LOW_STOCK'
})

/**
 * FE-504 游客购物车守卫：仅游客态受 mall.guest-cart.enabled 控制（fail-open 默认开放）；
 * 已登录会员走会员车，任何情况下不受该开关影响。
 */
const guestCartBlocked = computed(
  () => !member.isAuthenticated && !features.hasFeature('mall.guest-cart.enabled', true),
)

function stockStatusOf(skuId: string): StockStatus {
  return stockMap.value[skuId] ?? 'UNKNOWN'
}

async function load() {
  const id = route.params.id as string
  if (!id) {
    notFound.value = true
    loading.value = false
    return
  }
  loading.value = true
  error.value = ''
  notFound.value = false
  try {
    const data = await catalogApi.getProductDetail(id)
    detail.value = data
    activeImage.value = data.mainImageUrl || data.images[0]?.imageUrl || ''
    currentSku.value = null
    // 批量查询所有启用 SKU 的可售状态；三态接口失败不阻塞图文浏览（UNKNOWN 降级）
    const skuIds = Object.values(data.skuIndex).map((e) => e.skuId)
    if (skuIds.length) {
      try {
        const list = await catalogApi.getSkuAvailability(skuIds)
        const map: Record<string, StockStatus> = {}
        for (const item of list) map[item.skuId] = item.stockStatus
        stockMap.value = map
      } catch {
        stockMap.value = {}
      }
    }
  } catch (e) {
    if (hasResponseStatus(e) && e.response?.status === 404) {
      notFound.value = true
    } else {
      error.value = resolveErrorMessage(e, '商品加载失败，请稍后重试')
    }
  } finally {
    loading.value = false
  }
}

function onSkuChange(sku: SkuIndexEntry | null) {
  currentSku.value = sku
  if (sku?.imageUrl) activeImage.value = sku.imageUrl
}

function onImageError(e: Event) {
  ;(e.target as HTMLImageElement).src =
    'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect fill="%23f0f0f0" width="400" height="400"/><text x="50%" y="50%" fill="%23999" font-size="20" text-anchor="middle" dy=".3em">暂无图片</text></svg>'
}

async function retryUnknown() {
  if (!currentSku.value) return
  try {
    const list = await catalogApi.getSkuAvailability([currentSku.value.skuId])
    if (list[0]) stockMap.value[currentSku.value.skuId] = list[0].stockStatus
  } catch {
    /* 保持 UNKNOWN */
  }
}

async function addToCart() {
  if (!currentSku.value) return
  // FE-504：实际触发处兜底守卫，防止绕过禁用态写入游客车
  if (guestCartBlocked.value) {
    addMessageWarn.value = true
    addMessage.value = '游客购物车暂未开放，请登录后加购'
    setTimeout(() => {
      addMessage.value = ''
    }, 2000)
    return
  }
  const res = await cart.addItem(currentSku.value.skuId, 1)
  addMessageWarn.value = false
  addMessage.value = res.success ? '已加入购物车' : (res.message ?? '加购失败')
  setTimeout(() => {
    addMessage.value = ''
  }, 2000)
}

/** 立即购买：会员携带 BUY_NOW 行进入结算页；游客先登录（回跳商品详情后重新发起） */
async function buyNow() {
  if (!currentSku.value) return
  if (!member.isAuthenticated && !(await member.restore())) {
    void router.push({ path: '/login', query: { redirect: route.fullPath } })
    return
  }
  checkout.startBuyNow({ skuId: currentSku.value.skuId, quantity: 1 })
  void router.push('/checkout?source=BUY_NOW')
}

load()
</script>

<style scoped>
.product-detail {
  max-width: var(--content-max-width);
  margin: 0 auto;
}

/* ── 面包屑 ────────────────────────────── */
.breadcrumb {
  margin-bottom: var(--space-4);
  font-size: var(--text-sm);
  color: var(--color-text-tertiary);
}
.breadcrumb a {
  color: var(--color-text-tertiary);
}
.breadcrumb a:hover {
  color: var(--color-text);
}
.breadcrumb__sep {
  margin: 0 var(--space-2);
  color: var(--color-text-muted);
}

/* ── 详情主区 ──────────────────────────── */
.detail-main {
  display: grid;
  grid-template-columns: 480px 1fr;
  gap: var(--space-10);
  margin-bottom: var(--space-12);
}

/* ── 图廊 ──────────────────────────────── */
.gallery {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
.gallery__main {
  width: 100%;
  aspect-ratio: 1 / 1;
  background: var(--color-bg-muted);
  border-radius: var(--radius-lg);
  overflow: hidden;
}
.gallery__main img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.gallery__thumbs {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
}
.gallery__thumb {
  width: 64px;
  height: 64px;
  border: 2px solid transparent;
  border-radius: var(--radius-md);
  background: var(--color-bg-muted);
  padding: 0;
  overflow: hidden;
  cursor: pointer;
  transition: border-color var(--transition-fast);
}
.gallery__thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.gallery__thumb:hover {
  border-color: var(--color-border-strong);
}
.gallery__thumb.active {
  border-color: var(--color-text);
}

/* ── 信息区 ────────────────────────────── */
.info {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding-top: var(--space-2);
}

.info__name {
  margin: 0;
  font-size: var(--text-3xl);
  font-weight: 700;
  color: var(--color-text);
  letter-spacing: var(--tracking-tight);
  line-height: var(--leading-tight);
}

.info__subtitle {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--text-md);
  line-height: var(--leading-normal);
}

.info__brand {
  margin: 0;
  color: var(--color-text-tertiary);
  font-size: var(--text-sm);
}
.info__brand-name {
  color: var(--color-text-secondary);
  font-weight: 500;
}

/* 价格行：商品导向，价格突出 */
.info__price-row {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-4) var(--space-5);
  background: var(--color-bg-subtle);
  border-radius: var(--radius-lg);
  margin-top: var(--space-2);
}
.info__price-block {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}
.info__price-label {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  font-weight: 500;
  letter-spacing: 0.05em;
}
.info__price-value {
  font-size: var(--text-3xl);
  font-weight: 700;
}

.info__actions {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-top: var(--space-6);
}

.action-btn {
  padding: var(--space-3) var(--space-8);
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  font-size: var(--text-md);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
  min-width: 180px;
  text-align: center;
}
.action-btn:focus-visible {
  outline: 2px solid var(--color-border-focus);
  outline-offset: 2px;
}

.action-btn--ghost {
  border-color: var(--color-text);
  background: var(--color-bg);
  color: var(--color-text);
}
.action-btn--ghost:hover:not(:disabled) {
  background: var(--color-bg-muted);
}
.action-btn--ghost:active:not(:disabled) {
  background: var(--color-bg-subtle);
}

.action-btn--primary {
  background: var(--color-primary);
  color: var(--color-text-on-primary);
}
.action-btn--primary:hover:not(:disabled) {
  background: var(--color-primary-hover);
}
.action-btn--primary:active:not(:disabled) {
  background: var(--color-primary-active);
}

.action-btn:disabled {
  background: var(--color-bg-muted);
  color: var(--color-text-muted);
  border-color: var(--color-bg-muted);
  cursor: not-allowed;
}

.info__add-message {
  font-size: var(--text-sm);
  color: var(--color-success);
  font-weight: 500;
}
.info__add-message--warn {
  color: var(--color-warning);
}

/* FE-504 游客购物车关闭提示 */
.info__guest-hint {
  margin: calc(-1 * var(--space-2)) 0 0;
  font-size: var(--text-sm);
  color: var(--color-text-tertiary);
}
.info__guest-hint-link {
  color: var(--color-primary);
  font-weight: 500;
}
.info__guest-hint-link:hover {
  text-decoration: underline;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--transition-fast);
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* ── 描述区 ────────────────────────────── */
.description {
  margin-top: var(--space-12);
  padding-top: var(--space-8);
  border-top: 1px solid var(--color-border);
}
.description__title {
  margin: 0 0 var(--space-4);
  font-size: var(--text-xl);
  font-weight: 700;
  color: var(--color-text);
  letter-spacing: var(--tracking-tight);
}
.rich-text {
  color: var(--color-text-secondary);
  line-height: var(--leading-relaxed);
}
.rich-text :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: var(--radius-md);
}

/* ── Not found ──────────────────────────── */
.not-found {
  text-align: center;
  padding: var(--space-16) 0;
}
.not-found__title {
  margin: 0 0 var(--space-2);
  font-size: var(--text-2xl);
  color: var(--color-text);
}
.not-found__text {
  margin: 0 0 var(--space-4);
  color: var(--color-text-tertiary);
  font-size: var(--text-sm);
}
.not-found__action {
  display: inline-block;
  padding: var(--space-2) var(--space-4);
  border: 1px solid var(--color-text);
  border-radius: var(--radius-md);
  color: var(--color-text);
  font-size: var(--text-sm);
}

/* ── 响应式：移动端单列 ───────────────── */
@media (max-width: 960px) {
  .detail-main {
    grid-template-columns: 1fr;
    gap: var(--space-6);
  }
  .info__name {
    font-size: var(--text-2xl);
  }
  .info__price-value {
    font-size: var(--text-2xl);
  }
  .gallery__main {
    aspect-ratio: 4 / 3;
  }
  .action-btn {
    min-width: auto;
    flex: 1;
    padding: var(--space-3) var(--space-4);
  }
}
@media (max-width: 600px) {
  .info__actions {
    flex-wrap: wrap;
  }
}
</style>
