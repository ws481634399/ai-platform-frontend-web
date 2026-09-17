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
          购物车还是空的，去逛逛吧~
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
            全选
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
          <div class="cart-row__price">
            ¥{{ fenToYuan(item.priceFen ?? 0) }}
          </div>
          <div class="cart-row__qty">
            <div class="stepper">
              <button
                type="button"
                :disabled="item.invalid"
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
                @change="onStepperChange(item.skuId, Number(($event.target as HTMLInputElement).value))"
              >
              <button
                type="button"
                :disabled="item.invalid"
                @click="onStepperChange(item.skuId, item.quantity + 1)"
              >
                +
              </button>
            </div>
          </div>
          <div class="cart-row__stock">
            <StockBadge :status="item.stockStatus" />
          </div>
          <div class="cart-row__subtotal">
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
      <span>已选 <strong>{{ selectedCount }}</strong> 件</span>
      <span class="cart-summary__total">合计：<strong>¥{{ fenToYuan(selectedTotalFen) }}</strong></span>
      <button
        type="button"
        class="cart-summary__checkout"
        :class="{ 'cart-summary__checkout--active': selectedCount > 0 }"
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
.cart-view { max-width: 1000px; margin: 0 auto; }
.cart-view__title { font-size: 20px; margin-bottom: 16px; }
.cart-view__merge-msg { padding: 8px 16px; background: #fff7ed; color: #c2410c; border-radius: 6px; margin-bottom: 12px; }
.cart-view__guest-banner { padding: 8px 16px; background: #eff6ff; color: #1d4ed8; border-radius: 6px; margin-bottom: 12px; }
.cart-view__empty { padding: 48px; text-align: center; color: #9ca3af; }

.cart-row { display: grid; grid-template-columns: 50px 1fr 100px 140px 90px 100px 80px; align-items: center; gap: 12px; padding: 12px; border-bottom: 1px solid #f0f0f0; }
.cart-row--head { font-weight: 600; color: #6b7280; font-size: 13px; }
.cart-row--invalid { opacity: 0.55; }
.cart-row__check { display: flex; align-items: center; gap: 6px; cursor: pointer; }
.cart-row__info { display: flex; gap: 12px; align-items: flex-start; }
.cart-row__img { width: 64px; height: 64px; object-fit: cover; border-radius: 4px; background: #f5f5f5; }
.cart-row__img--placeholder { border: 1px solid #eee; }
.cart-row__name { font-weight: 500; }
.cart-row__sku { color: #6b7280; font-size: 13px; }
.cart-row__specs { color: #9ca3af; font-size: 12px; }
.cart-row__invalid-tag { color: #dc2626; font-size: 12px; margin-top: 4px; }
.cart-row__price { color: #dc2626; }
.cart-row__subtotal { color: #dc2626; font-weight: 500; }
.cart-row__delete { border: none; background: none; color: #9ca3af; cursor: pointer; }
.cart-row__delete:hover { color: #dc2626; }

.stepper { display: flex; align-items: center; }
.stepper button { width: 28px; height: 28px; border: 1px solid #e5e7eb; background: #fff; cursor: pointer; }
.stepper input { width: 44px; height: 28px; text-align: center; border: 1px solid #e5e7eb; border-left: none; border-right: none; }

.cart-summary { position: sticky; bottom: 0; display: flex; align-items: center; justify-content: flex-end; gap: 24px; padding: 16px; background: #fff; border-top: 1px solid #e5e7eb; }
.cart-summary__total strong { color: #dc2626; font-size: 18px; }
.cart-summary__checkout { padding: 10px 32px; background: #fca5a5; color: #fff; border: none; border-radius: 4px; cursor: not-allowed; }
.cart-summary__checkout--active { background: #dc2626; cursor: pointer; }
</style>
