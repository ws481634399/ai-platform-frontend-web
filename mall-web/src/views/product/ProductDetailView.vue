<template>
  <StateView :loading="loading" :error="error" :is-empty="notFound" @retry="load">
    <template #empty>
      <div class="not-found">
        <h2>商品不存在</h2>
        <p>该商品可能已下架或链接有误。</p>
        <router-link to="/products">返回商品列表</router-link>
      </div>
    </template>
    <template #default>
      <div v-if="detail" class="product-detail">
        <nav class="breadcrumb">
          <router-link to="/">首页</router-link>
          <span v-for="node in detail.categoryPath" :key="node.id">
            <span class="sep">/</span>
            <router-link :to="`/products?categoryId=${node.id}`">{{ node.name }}</router-link>
          </span>
        </nav>

        <div class="detail-main">
          <div class="gallery">
            <div class="main-image">
              <img
                :src="activeImage"
                :alt="detail.productName"
                @error="onImageError"
              />
            </div>
            <div class="thumbs" v-if="detail.images.length">
              <img
                v-for="img in detail.images"
                :key="img.id"
                :src="img.imageUrl"
                :class="{ active: img.imageUrl === activeImage }"
                @click="activeImage = img.imageUrl"
              />
            </div>
          </div>

          <div class="info">
            <h1 class="name">{{ detail.productName }}</h1>
            <p v-if="detail.subtitle" class="subtitle">{{ detail.subtitle }}</p>
            <p v-if="detail.brandName" class="brand">品牌：{{ detail.brandName }}</p>

            <div class="price-row">
              <PriceText :value="currentPrice" />
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

            <div class="actions">
              <button
                type="button"
                class="add-cart-btn"
                :disabled="!canAddToCart"
                @click="addToCart"
              >
                加入购物车
              </button>
            </div>
          </div>
        </div>

        <section class="description" v-if="detail.description">
          <h3>商品详情</h3>
          <div class="rich-text" v-html="sanitizedDescription"></div>
        </section>
      </div>
    </template>
  </StateView>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import DOMPurify from 'dompurify'
import { catalogApi, type ProductDetail, type SkuIndexEntry, type StockStatus } from '@/api/catalog'
import { resolveErrorMessage } from '@/utils/http-error'
import StateView from '@/components/StateView.vue'
import PriceText from '@/components/PriceText.vue'
import SkuSelector from '@/components/SkuSelector.vue'
import StockBadge from '@/components/StockBadge.vue'

const route = useRoute()
const detail = ref<ProductDetail | null>(null)
const loading = ref(true)
const error = ref('')
const notFound = ref(false)
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

function stockStatusOf(skuId: string): StockStatus {
  return stockMap.value[skuId] ?? 'UNKNOWN'
}

async function load() {
  const id = route.params.id as string
  if (!id) { notFound.value = true; loading.value = false; return }
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
  } catch (e: any) {
    if (e?.response?.status === 404) {
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
  (e.target as HTMLImageElement).src =
    'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect fill="%23f0f0f0" width="400" height="400"/><text x="50%" y="50%" fill="%23999" font-size="20" text-anchor="middle" dy=".3em">暂无图片</text></svg>'
}

async function retryUnknown() {
  if (!currentSku.value) return
  try {
    const list = await catalogApi.getSkuAvailability([currentSku.value.skuId])
    if (list[0]) stockMap.value[currentSku.value.skuId] = list[0].stockStatus
  } catch { /* 保持 UNKNOWN */ }
}

function addToCart() {
  // CHG-0018 DU-FE-801 接入购物车；本 Story 仅占位事件
  console.info('addToCart placeholder', currentSku.value?.skuId)
}

load()
</script>

<style scoped>
.product-detail { max-width: 1200px; margin: 0 auto; padding: 16px; }
.breadcrumb { margin-bottom: 16px; font-size: 13px; color: #999; }
.breadcrumb a { color: #409eff; text-decoration: none; }
.sep { margin: 0 6px; }
.detail-main { display: flex; gap: 32px; }
.gallery { width: 400px; }
.main-image img { width: 100%; height: 400px; object-fit: contain; border: 1px solid #eee; }
.thumbs { display: flex; gap: 8px; margin-top: 12px; }
.thumbs img { width: 60px; height: 60px; object-fit: cover; border: 2px solid transparent; cursor: pointer; }
.thumbs img.active { border-color: #409eff; }
.info { flex: 1; }
.name { font-size: 22px; margin: 0 0 8px; }
.subtitle { color: #666; margin: 0 0 12px; }
.brand { color: #888; margin: 0 0 16px; }
.price-row { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
.actions { margin-top: 24px; }
.add-cart-btn {
  padding: 12px 48px; background: #409eff; color: #fff; border: none;
  border-radius: 4px; font-size: 16px; cursor: pointer;
}
.add-cart-btn:disabled { background: #ccc; cursor: not-allowed; }
.description { margin-top: 40px; }
.description h3 { border-bottom: 1px solid #eee; padding-bottom: 8px; }
.not-found { text-align: center; padding: 80px 0; }
.not-found a { color: #409eff; }
</style>
