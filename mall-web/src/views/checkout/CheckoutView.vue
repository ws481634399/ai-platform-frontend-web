<template>
  <div class="checkout">
    <h1 class="checkout__title">
      确认订单
    </h1>

    <StateView
      :loading="loading"
      :error="error"
      :is-empty="false"
      @retry="loadPreview"
    >
      <!-- 收货地址 -->
      <section
        class="panel"
        data-testid="checkout-addresses"
      >
        <div class="panel__head">
          <h2>收货地址</h2>
          <router-link
            to="/member/addresses"
            class="panel__link"
          >
            管理地址
          </router-link>
        </div>
        <div
          v-if="addressStore.items.length"
          class="address-list"
        >
          <label
            v-for="addr in addressStore.items"
            :key="addr.id"
            class="address-item"
            :class="{ 'address-item--active': selectedAddressId === addr.id }"
          >
            <input
              v-model="selectedAddressId"
              type="radio"
              name="addressId"
              :value="addr.id"
              data-testid="checkout-address-radio"
              @change="loadPreview"
            >
            <span class="address-item__name">{{ addr.receiverName }} {{ addr.receiverPhone }}</span>
            <span class="address-item__detail">
              {{ addr.province }}{{ addr.city }}{{ addr.district }}{{ addr.detailAddress }}
            </span>
            <span
              v-if="addr.isDefault"
              class="address-item__default"
            >默认</span>
          </label>
        </div>
        <div
          v-else
          class="address-empty"
          data-testid="checkout-no-address"
        >
          还没有收货地址，请先
          <router-link to="/member/addresses">
            新增收货地址
          </router-link>
        </div>
      </section>

      <!-- 商品清单 -->
      <section class="panel">
        <div class="panel__head">
          <h2>商品清单</h2>
          <span class="panel__tip">价格、库存以下单时服务端实时复核为准</span>
        </div>
        <div
          v-if="preview"
          class="goods"
        >
          <div
            v-for="item in preview.items"
            :key="item.skuId"
            class="goods-row"
            :class="{ 'goods-row--invalid': !item.salable }"
            :data-testid="`checkout-item-${item.skuId}`"
          >
            <img
              v-if="item.mainImageUrl"
              :src="item.mainImageUrl"
              class="goods-row__img"
              alt=""
            >
            <div
              v-else
              class="goods-row__img goods-row__img--placeholder"
            />
            <div class="goods-row__meta">
              <div class="goods-row__name">
                {{ item.productName }}
              </div>
              <div
                v-if="item.skuCode || specText(item.specifications)"
                class="goods-row__spec"
              >
                {{ [item.skuCode, specText(item.specifications)].filter(Boolean).join(' / ') }}
              </div>
              <div
                v-for="code in item.issueCodes"
                :key="code"
                class="goods-row__issue"
              >
                {{ issueLabel(code) }}
              </div>
            </div>
            <div class="goods-row__price">
              ¥{{ fenToYuan(item.unitPriceFen) }}
            </div>
            <div class="goods-row__qty">
              ×{{ item.quantity }}
            </div>
            <div class="goods-row__subtotal">
              ¥{{ fenToYuan(item.subtotalFen) }}
            </div>
          </div>
          <div
            v-if="!preview.items.length"
            class="goods-empty"
            data-testid="checkout-empty-items"
          >
            没有可结算的商品（购物车需先勾选商品）。
          </div>
        </div>
      </section>

      <!-- 金额栏 + 提交 -->
      <section
        v-if="preview"
        class="panel summary"
        data-testid="checkout-summary"
      >
        <div class="summary__row">
          <span>商品总额</span><span>¥{{ fenToYuan(preview.goodsAmountFen) }}</span>
        </div>
        <div class="summary__row">
          <span>运费</span><span>¥{{ fenToYuan(preview.freightAmountFen) }}</span>
        </div>
        <div class="summary__row summary__row--pay">
          <span>应付金额</span><strong>¥{{ fenToYuan(preview.payAmountFen) }}</strong>
        </div>
        <button
          type="button"
          class="summary__submit"
          :disabled="!preview.availableToSubmit || submitting || !selectedAddressId"
          data-testid="checkout-submit"
          @click="submit"
        >
          {{ submitting ? '提交中…' : '提交订单' }}
        </button>
        <p
          v-if="!preview.availableToSubmit"
          class="summary__blocked"
          data-testid="checkout-blocked"
        >
          当前存在不可售或库存不足商品，无法提交订单
        </p>
      </section>
    </StateView>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import StateView from '@/components/StateView.vue'
import { orderApi } from '@/api/order'
import type { OrderSource, PreviewView } from '@/types/order'
import { useCheckoutStore } from '@/stores/checkout'
import { useAddressStore } from '@/stores/address'
import { useCartStore } from '@/stores/cart'
import { resolveErrorMessage } from '@/utils/http-error'
import { fenToYuan, issueLabel } from '@/utils/order'

const route = useRoute()
const router = useRouter()
const checkout = useCheckoutStore()
const addressStore = useAddressStore()
const cart = useCartStore()

const loading = ref(false)
const submitting = ref(false)
const error = ref('')
const preview = ref<PreviewView | null>(null)
const selectedAddressId = ref('')

function specText(specs: Record<string, string>): string {
  return Object.values(specs ?? {}).join(' / ')
}

function resolveSource(): OrderSource | null {
  const raw = route.query.source
  const source = typeof raw === 'string' ? raw : checkout.source
  return source === 'CART' || source === 'BUY_NOW' ? source : null
}

async function loadPreview(): Promise<void> {
  const source = resolveSource()
  if (!source) {
    error.value = '结算入口无效，请从购物车或商品详情发起结算'
    return
  }
  if (source === 'BUY_NOW' && !checkout.buyNowItems.length) {
    error.value = '购买商品信息已失效，请重新选择商品'
    return
  }
  if (!selectedAddressId.value) {
    preview.value = null
    return
  }
  loading.value = true
  error.value = ''
  try {
    preview.value = await orderApi.preview({
      source,
      addressId: selectedAddressId.value,
      items: source === 'BUY_NOW' ? checkout.buyNowItems : undefined,
    })
  } catch (e) {
    error.value = resolveErrorMessage(e, '订单预览加载失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

async function submit(): Promise<void> {
  if (!preview.value?.submitToken || !selectedAddressId.value) return
  const source = resolveSource()
  if (!source) return
  submitting.value = true
  try {
    const order = await orderApi.create({
      submitToken: preview.value.submitToken,
      addressId: selectedAddressId.value,
      source,
      items: source === 'BUY_NOW' ? checkout.buyNowItems : undefined,
    })
    checkout.clear()
    if (source === 'CART') {
      // 已下单的勾选行由后端删除，重拉购物车保持角标一致
      await cart.loadMemberCart().catch(() => undefined)
    }
    await router.replace(`/orders/${encodeURIComponent(order.orderNo)}`)
  } catch (e) {
    error.value = resolveErrorMessage(e, '订单提交失败，请稍后重试')
    // 令牌可能已被消费/失效，刷新预览重新签发
    await loadPreview()
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  await addressStore.fetchList().catch(() => undefined)
  if (!selectedAddressId.value) {
    selectedAddressId.value = addressStore.defaultId ?? addressStore.items[0]?.id ?? ''
  }
  await loadPreview()
})
</script>

<style scoped>
.checkout { max-width: 1000px; margin: 0 auto; }
.checkout__title { font-size: 20px; margin-bottom: 16px; }
.panel { background: #fff; border: 1px solid #eee; border-radius: 8px; padding: 16px 20px; margin-bottom: 16px; }
.panel__head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.panel__head h2 { font-size: 16px; margin: 0; }
.panel__link { color: #2563eb; font-size: 13px; text-decoration: none; }
.panel__tip { color: #9ca3af; font-size: 12px; }

.address-list { display: flex; flex-direction: column; gap: 8px; }
.address-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border: 1px solid #e5e7eb; border-radius: 6px; cursor: pointer; }
.address-item--active { border-color: #2563eb; background: #eff6ff; }
.address-item__name { font-weight: 500; }
.address-item__detail { color: #4b5563; font-size: 13px; }
.address-item__default { background: #dbeafe; color: #1d4ed8; font-size: 11px; padding: 1px 6px; border-radius: 4px; }
.address-empty { color: #6b7280; font-size: 14px; padding: 8px 0; }
.address-empty a { color: #2563eb; }

.goods-row { display: grid; grid-template-columns: 64px 1fr 100px 70px 110px; gap: 12px; align-items: center; padding: 10px 0; border-bottom: 1px solid #f3f4f6; }
.goods-row--invalid { opacity: 0.7; }
.goods-row__img { width: 64px; height: 64px; object-fit: cover; border-radius: 4px; background: #f5f5f5; }
.goods-row__img--placeholder { border: 1px solid #eee; }
.goods-row__name { font-weight: 500; }
.goods-row__spec { color: #9ca3af; font-size: 12px; }
.goods-row__issue { color: #dc2626; font-size: 12px; }
.goods-row__price, .goods-row__subtotal { color: #dc2626; }
.goods-row__qty { color: #6b7280; }
.goods-empty { color: #9ca3af; padding: 16px 0; }

.summary { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; }
.summary__row { display: flex; justify-content: space-between; width: 280px; color: #4b5563; font-size: 14px; }
.summary__row--pay { font-size: 16px; color: #111827; }
.summary__row--pay strong { color: #dc2626; font-size: 22px; }
.summary__submit { margin-top: 8px; padding: 10px 48px; background: #dc2626; color: #fff; border: none; border-radius: 4px; font-size: 16px; cursor: pointer; }
.summary__submit:disabled { background: #d1d5db; cursor: not-allowed; }
.summary__blocked { color: #dc2626; font-size: 13px; margin: 6px 0 0; }
</style>
