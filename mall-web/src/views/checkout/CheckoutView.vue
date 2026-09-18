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
          <h2 class="panel__title">收货地址</h2>
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
            <div class="address-item__main">
              <div class="address-item__head">
                <span class="address-item__name">{{ addr.receiverName }}</span>
                <span class="address-item__phone">{{ addr.receiverPhone }}</span>
                <span
                  v-if="addr.isDefault"
                  class="address-item__default"
                >默认</span>
              </div>
              <div class="address-item__detail">
                {{ addr.province }}{{ addr.city }}{{ addr.district }}{{ addr.detailAddress }}
              </div>
            </div>
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
          <h2 class="panel__title">商品清单</h2>
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
            <div class="goods-row__price tabular">
              ¥{{ fenToYuan(item.unitPriceFen) }}
            </div>
            <div class="goods-row__qty">
              ×{{ item.quantity }}
            </div>
            <div class="goods-row__subtotal tabular">
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
        <div class="summary__rows">
          <div class="summary__row">
            <span>商品总额</span>
            <span class="tabular">¥{{ fenToYuan(preview.goodsAmountFen) }}</span>
          </div>
          <div class="summary__row">
            <span>运费</span>
            <span class="tabular">¥{{ fenToYuan(preview.freightAmountFen) }}</span>
          </div>
          <div class="summary__row summary__row--pay">
            <span>应付金额</span>
            <strong class="tabular">¥{{ fenToYuan(preview.payAmountFen) }}</strong>
          </div>
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
.checkout {
  max-width: 1000px;
  margin: 0 auto;
}
.checkout__title {
  margin: 0 0 var(--space-6);
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--color-text);
  letter-spacing: var(--tracking-tight);
}

/* ── Panel ─────────────────────────── */
.panel {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-4) var(--space-5);
  margin-bottom: var(--space-4);
}
.panel__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: var(--space-4);
  gap: var(--space-2);
}
.panel__title {
  margin: 0;
  font-size: var(--text-md);
  font-weight: 600;
  color: var(--color-text);
}
.panel__link {
  font-size: var(--text-sm);
  color: var(--color-accent);
}
.panel__tip {
  color: var(--color-text-tertiary);
  font-size: var(--text-xs);
}

/* ── 地址 ──────────────────────────── */
.address-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-3);
}
.address-item {
  display: flex;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}
.address-item:hover {
  border-color: var(--color-border-strong);
  background: var(--color-bg-subtle);
}
.address-item--active {
  border-color: var(--color-text);
  background: var(--color-bg-subtle);
}
.address-item input {
  margin: 0;
  margin-top: var(--space-1);
  accent-color: var(--color-primary);
  width: 16px;
  height: 16px;
}
.address-item__main {
  flex: 1;
  min-width: 0;
}
.address-item__head {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-1);
}
.address-item__name {
  font-weight: 600;
  color: var(--color-text);
  font-size: var(--text-sm);
}
.address-item__phone {
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
}
.address-item__default {
  padding: 0 var(--space-2);
  background: var(--color-accent-bg);
  color: var(--color-accent);
  font-size: var(--text-xs);
  border-radius: var(--radius-xs);
  font-weight: 500;
}
.address-item__detail {
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
  line-height: var(--leading-normal);
}
.address-empty {
  color: var(--color-text-tertiary);
  font-size: var(--text-sm);
  padding: var(--space-2) 0;
}

/* ── 商品清单 ──────────────────────── */
.goods-row {
  display: grid;
  grid-template-columns: 80px 1fr 100px 70px 110px;
  gap: var(--space-3);
  align-items: center;
  padding: var(--space-3) 0;
  border-bottom: 1px solid var(--color-border);
}
.goods-row:last-child {
  border-bottom: none;
}
.goods-row--invalid {
  opacity: 0.7;
}
.goods-row__img {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: var(--radius-md);
  background: var(--color-bg-muted);
}
.goods-row__img--placeholder {
  border: 1px solid var(--color-border);
}
.goods-row__name {
  font-weight: 500;
  color: var(--color-text);
  font-size: var(--text-sm);
}
.goods-row__spec {
  color: var(--color-text-tertiary);
  font-size: var(--text-xs);
  margin-top: var(--space-1);
}
.goods-row__issue {
  color: var(--color-danger);
  font-size: var(--text-xs);
  margin-top: var(--space-1);
}
.goods-row__price {
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
}
.goods-row__subtotal {
  color: var(--color-price);
  font-weight: 600;
  font-size: var(--text-sm);
}
.goods-row__qty {
  color: var(--color-text-tertiary);
  font-size: var(--text-sm);
}
.goods-empty {
  color: var(--color-text-tertiary);
  padding: var(--space-4) 0;
  font-size: var(--text-sm);
}

/* ── 金额栏 ────────────────────────── */
.summary {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--space-4);
  background: var(--color-bg-subtle);
}
.summary__rows {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  width: 100%;
  max-width: 320px;
}
.summary__row {
  display: flex;
  justify-content: space-between;
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
}
.summary__row--pay {
  padding-top: var(--space-2);
  border-top: 1px solid var(--color-border);
  font-size: var(--text-md);
  color: var(--color-text);
}
.summary__row--pay strong {
  color: var(--color-price);
  font-size: var(--text-2xl);
  font-weight: 700;
}
.summary__submit {
  width: 100%;
  max-width: 320px;
  padding: var(--space-3) var(--space-8);
  background: var(--color-primary);
  color: var(--color-text-on-primary);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--text-md);
  font-weight: 500;
  cursor: pointer;
  transition: background var(--transition-fast);
}
.summary__submit:hover:not(:disabled) {
  background: var(--color-primary-hover);
}
.summary__submit:active:not(:disabled) {
  background: var(--color-primary-active);
}
.summary__submit:disabled {
  background: var(--color-bg-muted);
  color: var(--color-text-muted);
  cursor: not-allowed;
}
.summary__blocked {
  color: var(--color-danger);
  font-size: var(--text-xs);
  margin: 0;
}

@media (max-width: 640px) {
  .goods-row {
    grid-template-columns: 64px 1fr;
    grid-template-rows: auto auto auto;
  }
  .goods-row__img {
    width: 64px;
    height: 64px;
    grid-row: 1 / 3;
  }
  .goods-row__price,
  .goods-row__qty,
  .goods-row__subtotal {
    grid-column: 2;
    font-size: var(--text-xs);
  }
}
</style>
