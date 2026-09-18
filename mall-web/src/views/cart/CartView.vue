<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import StateView from '@/components/StateView.vue'
import StockBadge from '@/components/StockBadge.vue'
import { useCartStore } from '@/stores/cart'
import { useCheckoutStore } from '@/stores/checkout'
import { cartApi, type SkuItemView } from '@/api/cart'
import { catalogApi, type StockStatus, type SkuAvailability } from '@/api/catalog'
import { resolveErrorMessage } from '@/utils/http-error'

const router = useRouter()
const checkout = useCheckoutStore()

interface DisplayItem {
  skuId: string
  productId: string | null
  productName: string | null
  skuName: string | null
  specs: Record<string, string>
  imageUrl: string | null
  priceFen: number | null
  quantity: number
  selected: boolean
  stockStatus: StockStatus
  invalid: boolean
}

const cart = useCartStore()
const loading = ref(false)
const error = ref('')
const skuItems = ref<Record<string, SkuItemView>>({})
const stockMap = ref<Record<string, StockStatus>>({})

/** 会员车直接用后端读模型 */
const memberItems = computed<DisplayItem[]>(() =>
  (cart.memberCart?.items ?? []).map((it) => ({
    skuId: it.skuId,
    productId: it.productId,
    productName: it.productName,
    skuName: it.skuName,
    specs: it.specs,
    imageUrl: it.imageUrl,
    priceFen: it.priceFen,
    quantity: it.quantity,
    selected: it.selected,
    stockStatus: it.stockStatus,
    invalid: false,
  })),
)

/** 游客车：本地条目 + 公开 SKU 信息 + 库存状态 */
const guestItems = computed<DisplayItem[]>(() =>
  cart.guest.items.map((it) => {
    const sku = skuItems.value[it.skuId]
    const invalid = !sku
    return {
      skuId: it.skuId,
      productId: sku?.productId ?? null,
      productName: sku?.productName ?? '商品信息不可用',
      skuName: sku?.skuName ?? null,
      specs: sku?.specs ?? {},
      imageUrl: sku?.imageUrl ?? null,
      priceFen: sku?.priceFen ?? null,
      quantity: it.quantity,
      selected: it.selected,
      stockStatus: stockMap.value[it.skuId] ?? 'UNKNOWN',
      invalid,
    }
  }),
)

const items = computed(() => (cart.isGuest ? guestItems.value : memberItems.value))

const isEmpty = computed(() => items.value.length === 0)

const allSelected = computed(() => {
  if (isEmpty.value) return false
  return items.value.every((it) => it.selected)
})

/** 合计：仅有效 + 选中 + 有货（IN_STOCK/LOW_STOCK） */
const selectedTotalFen = computed(() => {
  return items.value
    .filter((it) => it.selected && !it.invalid && (it.stockStatus === 'IN_STOCK' || it.stockStatus === 'LOW_STOCK'))
    .reduce((sum, it) => sum + (it.priceFen ?? 0) * it.quantity, 0)
})

const selectedCount = computed(() =>
  items.value.filter((it) => it.selected && !it.invalid).reduce((s, it) => s + it.quantity, 0),
)

function fenToYuan(fen: number): string {
  return (fen / 100).toFixed(2)
}

/** 规格名值对格式化为展示文本：仅拼接值，以「 / 」分隔 */
function formatSpecs(specs: Record<string, string>): string {
  return Object.values(specs).join(' / ')
}

async function loadGuestData() {
  const skuIds = cart.guest.items.map((it) => it.skuId)
  if (!skuIds.length) {
    skuItems.value = {}
    stockMap.value = {}
    return
  }
  try {
    const [itemsRes, availRes] = await Promise.all([
      cartApi.getSkuItems({ skuIds }),
      catalogApi.getSkuAvailability(skuIds).catch(() => [] as SkuAvailability[]),
    ])
    const map: Record<string, SkuItemView> = {}
    for (const it of itemsRes) map[it.skuId] = it
    skuItems.value = map
    const sm: Record<string, StockStatus> = {}
    for (const a of availRes) sm[a.skuId] = a.stockStatus
    stockMap.value = sm
  } catch (e) {
    error.value = resolveErrorMessage(e, '商品信息加载失败')
  }
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    if (cart.isGuest) {
      await loadGuestData()
    } else {
      await cart.loadMemberCart()
      if (cart.error) error.value = cart.error
    }
  } finally {
    loading.value = false
  }
}

async function onStepperChange(skuId: string, quantity: number) {
  const res = await cart.updateItem(skuId, quantity)
  if (!res.success && res.message) error.value = res.message
}

async function onToggleSelected(skuId: string, selected: boolean) {
  await cart.setSelected(skuId, selected)
}

async function onToggleAll(selected: boolean) {
  await cart.selectAll(selected)
}

async function onRemove(skuId: string) {
  await cart.removeItems([skuId])
  if (cart.isGuest) await loadGuestData()
}

/** 购物车结算：来源 CART，勾选行由结算页调服务端实时读取 */
function goCheckout() {
  if (selectedCount.value === 0) return
  checkout.startCartCheckout()
  void router.push('/checkout?source=CART')
}

onMounted(() => {
  // 若合并 pending 则先重试
  if (cart.mergePending) cart.retryMerge()
  load()
})
</script>

<template>
  <div class="cart-view">
    <h1 class="cart-view__title">
      购物车
    </h1>

    <!-- 合并消息 -->
    <div
      v-if="cart.mergeMessage"
      class="cart-view__merge-msg"
      data-testid="cart-merge-message"
    >
      {{ cart.mergeMessage }}
    </div>

    <!-- 游客提示 -->
    <div
      v-if="cart.isGuest"
      class="cart-view__guest-banner"
      data-testid="cart-guest-banner"
    >
      当前为游客购物车，登录后将自动合并到会员账户。
    </div>

    <StateView
      :loading="loading"
      :error="error"
      :is-empty="isEmpty"
      @retry="load"
    >
      <template #empty>
        <div class="cart-view__empty">
          <p class="cart-view__empty-text">购物车还是空的</p>
          <router-link
            to="/products"
            class="cart-view__empty-action"
          >
            去逛逛吧
          </router-link>
        </div>
      </template>

      <div class="cart-view__content">
        <!-- 表头 + 全选 -->
        <div class="cart-row cart-row--head">
          <label class="cart-row__check">
            <input
              type="checkbox"
              :checked="allSelected"
              @change="onToggleAll(($event.target as HTMLInputElement).checked)"
            >
            <span>全选</span>
          </label>
          <span class="cart-row__info">商品信息</span>
          <span class="cart-row__price">单价</span>
          <span class="cart-row__qty">数量</span>
          <span class="cart-row__stock">库存</span>
          <span class="cart-row__subtotal">小计</span>
          <span class="cart-row__action">操作</span>
        </div>

        <div
          v-for="item in items"
          :key="item.skuId"
          class="cart-row"
          :class="{ 'cart-row--invalid': item.invalid }"
          :data-testid="`cart-item-${item.skuId}`"
        >
          <label class="cart-row__check">
            <input
              type="checkbox"
              :checked="item.selected"
              :disabled="item.invalid"
              @change="onToggleSelected(item.skuId, ($event.target as HTMLInputElement).checked)"
            >
          </label>
          <div class="cart-row__info">
            <img
              v-if="item.imageUrl"
              :src="item.imageUrl"
              alt=""
              class="cart-row__img"
            >
            <div
              v-else
              class="cart-row__img cart-row__img--placeholder"
            />
            <div class="cart-row__meta">
              <div class="cart-row__name">
                {{ item.productName }}
              </div>
              <div
                v-if="item.skuName"
                class="cart-row__sku"
              >
                {{ item.skuName }}
              </div>
              <div
                v-if="formatSpecs(item.specs)"
                class="cart-row__specs"
              >
                {{ formatSpecs(item.specs) }}
              </div>
              <div
                v-if="item.invalid"
                class="cart-row__invalid-tag"
              >
                商品已失效
              </div>
            </div>
          </div>
          <div class="cart-row__price tabular">
            ¥{{ fenToYuan(item.priceFen ?? 0) }}
          </div>
          <div class="cart-row__qty">
            <div class="stepper">
              <button
                type="button"
                :disabled="item.invalid"
                aria-label="减少数量"
                @click="onStepperChange(item.skuId, item.quantity - 1)"
              >
                −
              </button>
              <input
                type="number"
                :value="item.quantity"
                :disabled="item.invalid"
                min="1"
                max="999"
                aria-label="购买数量"
                @change="onStepperChange(item.skuId, Number(($event.target as HTMLInputElement).value))"
              >
              <button
                type="button"
                :disabled="item.invalid"
                aria-label="增加数量"
                @click="onStepperChange(item.skuId, item.quantity + 1)"
              >
                +
              </button>
            </div>
          </div>
          <div class="cart-row__stock">
            <StockBadge :status="item.stockStatus" />
          </div>
          <div class="cart-row__subtotal tabular">
            ¥{{ fenToYuan((item.priceFen ?? 0) * item.quantity) }}
          </div>
          <div class="cart-row__action">
            <button
              type="button"
              class="cart-row__delete"
              @click="onRemove(item.skuId)"
            >
              删除
            </button>
          </div>
        </div>
      </div>
    </StateView>

    <!-- 结算栏 -->
    <div
      v-if="!isEmpty"
      class="cart-summary"
    >
      <span class="cart-summary__count">已选 <strong>{{ selectedCount }}</strong> 件</span>
      <span class="cart-summary__total">
        合计 <strong class="tabular">¥{{ fenToYuan(selectedTotalFen) }}</strong>
      </span>
      <button
        type="button"
        class="cart-summary__checkout"
        :disabled="selectedCount === 0"
        :title="selectedCount === 0 ? '请先勾选要结算的商品' : ''"
        data-testid="cart-checkout-btn"
        @click="goCheckout"
      >
        去结算
      </button>
    </div>
  </div>
</template>

<style scoped>
.cart-view {
  max-width: 1000px;
  margin: 0 auto;
}

.cart-view__title {
  margin: 0 0 var(--space-6);
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--color-text);
  letter-spacing: var(--tracking-tight);
}

.cart-view__merge-msg {
  padding: var(--space-3) var(--space-4);
  background: var(--color-warning-bg);
  color: var(--color-warning);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  margin-bottom: var(--space-3);
  border-left: 3px solid var(--color-warning);
}

.cart-view__guest-banner {
  padding: var(--space-3) var(--space-4);
  background: var(--color-accent-bg);
  color: var(--color-accent);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  margin-bottom: var(--space-3);
}

.cart-view__empty {
  padding: var(--space-12) var(--space-4);
  text-align: center;
}
.cart-view__empty-text {
  margin: 0 0 var(--space-3);
  color: var(--color-text-tertiary);
  font-size: var(--text-base);
}
.cart-view__empty-action {
  display: inline-block;
  padding: var(--space-2) var(--space-4);
  border: 1px solid var(--color-text);
  border-radius: var(--radius-md);
  color: var(--color-text);
  font-size: var(--text-sm);
}

/* ── 表格行 ───────────────────────────── */
.cart-row {
  display: grid;
  grid-template-columns: 60px minmax(0, 1fr) 100px 140px 90px 100px 70px;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) 0;
  border-bottom: 1px solid var(--color-border);
}
.cart-row--head {
  font-weight: 500;
  color: var(--color-text-tertiary);
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom-color: var(--color-border-strong);
  padding: var(--space-2) 0;
}
.cart-row--invalid {
  opacity: 0.55;
}

.cart-row__check {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  cursor: pointer;
  font-size: var(--text-sm);
  color: var(--color-text-tertiary);
}
.cart-row__check input {
  margin: 0;
  accent-color: var(--color-primary);
  width: 16px;
  height: 16px;
}

.cart-row__info {
  display: flex;
  gap: var(--space-3);
  align-items: flex-start;
  min-width: 0;
}
.cart-row__img {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: var(--radius-md);
  background: var(--color-bg-muted);
  flex-shrink: 0;
}
.cart-row__img--placeholder {
  border: 1px solid var(--color-border);
}
.cart-row__meta {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 0;
}
.cart-row__name {
  font-weight: 500;
  color: var(--color-text);
  font-size: var(--text-sm);
}
.cart-row__sku {
  color: var(--color-text-tertiary);
  font-size: var(--text-xs);
}
.cart-row__specs {
  color: var(--color-text-muted);
  font-size: var(--text-xs);
}
.cart-row__invalid-tag {
  color: var(--color-danger);
  font-size: var(--text-xs);
  font-weight: 500;
}

.cart-row__price {
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
}
.cart-row__subtotal {
  color: var(--color-price);
  font-weight: 600;
  font-size: var(--text-md);
}
.cart-row__delete {
  border: none;
  background: none;
  color: var(--color-text-tertiary);
  cursor: pointer;
  font-size: var(--text-sm);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
}
.cart-row__delete:hover {
  color: var(--color-danger);
  background: var(--color-danger-bg);
}

/* ── Stepper ─────────────────────────── */
.stepper {
  display: inline-flex;
  align-items: center;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
  overflow: hidden;
}
.stepper button {
  width: 30px;
  height: 30px;
  border: none;
  background: var(--color-bg);
  cursor: pointer;
  color: var(--color-text-secondary);
  font-size: var(--text-md);
  transition: background var(--transition-fast);
}
.stepper button:hover:not(:disabled) {
  background: var(--color-bg-muted);
  color: var(--color-text);
}
.stepper button:disabled {
  color: var(--color-text-muted);
  cursor: not-allowed;
}
.stepper input {
  width: 44px;
  height: 30px;
  text-align: center;
  border: none;
  border-left: 1px solid var(--color-border);
  border-right: 1px solid var(--color-border);
  font-size: var(--text-sm);
  background: var(--color-bg);
  color: var(--color-text);
  -moz-appearance: textfield;
}
.stepper input::-webkit-outer-spin-button,
.stepper input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

/* ── 结算栏 ─────────────────────────── */
.cart-summary {
  position: sticky;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-6);
  padding: var(--space-4) var(--space-5);
  background: var(--color-bg);
  border-top: 1px solid var(--color-border-strong);
  border-radius: var(--radius-lg);
  margin-top: var(--space-4);
  box-shadow: var(--shadow-md);
}
.cart-summary__count {
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
}
.cart-summary__count strong {
  color: var(--color-text);
  font-weight: 600;
}
.cart-summary__total {
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
}
.cart-summary__total strong {
  color: var(--color-price);
  font-size: var(--text-xl);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.cart-summary__checkout {
  padding: var(--space-3) var(--space-8);
  background: var(--color-primary);
  color: var(--color-text-on-primary);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--text-md);
  font-weight: 500;
  cursor: pointer;
  transition: background var(--transition-fast);
  min-width: 120px;
}
.cart-summary__checkout:hover:not(:disabled) {
  background: var(--color-primary-hover);
}
.cart-summary__checkout:active:not(:disabled) {
  background: var(--color-primary-active);
}
.cart-summary__checkout:disabled {
  background: var(--color-bg-muted);
  color: var(--color-text-muted);
  cursor: not-allowed;
}

/* ── 响应式：表格简化为卡片 ──────────── */
@media (max-width: 768px) {
  .cart-row {
    grid-template-columns: 32px 1fr;
    grid-template-rows: auto auto auto;
    gap: var(--space-2);
    padding: var(--space-3);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    margin-bottom: var(--space-3);
  }
  .cart-row--head {
    display: none;
  }
  .cart-row__check {
    grid-column: 1;
    grid-row: 1;
  }
  .cart-row__info {
    grid-column: 2;
    grid-row: 1;
  }
  .cart-row__price,
  .cart-row__qty,
  .cart-row__stock,
  .cart-row__subtotal,
  .cart-row__action {
    grid-column: 2;
    grid-row: 2;
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
  }
  .cart-row__qty {
    grid-row: 3;
  }
  .cart-summary {
    flex-wrap: wrap;
    gap: var(--space-3);
    padding: var(--space-3) var(--space-4);
  }
}
</style>
