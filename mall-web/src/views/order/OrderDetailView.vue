<template>
  <div class="order-detail">
    <StateView
      :loading="loading"
      :error="error"
      :is-empty="false"
      @retry="load"
    >
      <template #default>
        <div
          v-if="order"
          data-testid="order-detail"
        >
          <div class="head">
            <router-link
              to="/orders"
              class="head__back"
            >
              ← 返回订单列表
            </router-link>
            <h1 class="head__no">
              订单号：{{ order.orderNo }}
            </h1>
            <span
              class="head__status"
              data-testid="order-detail-status"
            >{{ orderStatusLabel(order.status) }}</span>
          </div>

          <!-- 操作区 -->
          <div
            class="actions"
            data-testid="order-actions"
          >
            <button
              v-if="canPay(order.status)"
              type="button"
              class="actions__btn actions__btn--primary"
              :disabled="acting"
              data-testid="action-pay"
              @click="onPay"
            >
              立即支付
            </button>
            <button
              v-if="canCancel(order.status)"
              type="button"
              class="actions__btn"
              :disabled="acting"
              data-testid="action-cancel"
              @click="onCancel"
            >
              取消订单
            </button>
            <button
              v-if="canConfirmReceipt(order.status)"
              type="button"
              class="actions__btn actions__btn--primary"
              :disabled="acting"
              data-testid="action-confirm"
              @click="onConfirmReceipt"
            >
              确认收货
            </button>
            <span
              v-if="actionMessage"
              class="actions__msg"
              data-testid="action-message"
            >{{ actionMessage }}</span>
          </div>

          <!-- 收货信息 -->
          <section
            v-if="order.receiver"
            class="panel"
          >
            <h2>收货信息</h2>
            <p>{{ order.receiver.receiverName }} {{ order.receiver.receiverPhone }}</p>
            <p>
              {{ order.receiver.province }}{{ order.receiver.city }}{{ order.receiver.district }}
              {{ order.receiver.detailAddress }}
              <template v-if="order.receiver.postalCode">
                （{{ order.receiver.postalCode }}）
              </template>
            </p>
            <p
              v-if="order.deliveryCompany || order.trackingNo"
              class="panel__物流"
            >
              物流：{{ order.deliveryCompany ?? '—' }} / 运单号：{{ order.trackingNo ?? '—' }}
            </p>
            <p
              v-if="order.cancelReason"
              class="panel__cancel"
            >
              取消原因：{{ order.cancelReason }}
            </p>
          </section>

          <!-- 商品清单 -->
          <section class="panel">
            <h2>商品清单</h2>
            <div
              v-for="item in order.items"
              :key="item.skuId"
              class="goods-row"
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
            <div class="amount">
              <div>
                商品总额：¥{{ fenToYuan(order.goodsAmountFen) }}
              </div>
              <div>
                运费：¥{{ fenToYuan(order.freightAmountFen) }}
              </div>
              <div class="amount__pay">
                实付：<strong>¥{{ fenToYuan(order.payAmountFen) }}</strong>
              </div>
            </div>
          </section>

          <!-- 状态轨迹 -->
          <section class="panel">
            <h2>状态轨迹</h2>
            <ul
              class="timeline"
              data-testid="order-timeline"
            >
              <li
                v-for="(node, idx) in order.statusHistory"
                :key="`${node.operation}-${node.occurredAt}-${idx}`"
                class="timeline__item"
              >
                <span class="timeline__dot" />
                <div>
                  <div class="timeline__title">
                    {{ orderStatusLabel(node.toStatus) }}
                    <span class="timeline__op">（{{ operationLabel(node.operation) }}）</span>
                  </div>
                  <div class="timeline__time">
                    {{ formatDateTime(node.occurredAt) }}
                    <template v-if="node.reason">
                      · {{ node.reason }}
                    </template>
                  </div>
                </div>
              </li>
            </ul>
          </section>
        </div>
      </template>
    </StateView>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import StateView from '@/components/StateView.vue'
import { orderApi } from '@/api/order'
import type { OrderView } from '@/types/order'
import { resolveErrorMessage } from '@/utils/http-error'
import {
  canCancel,
  canConfirmReceipt,
  canPay,
  fenToYuan,
  formatDateTime,
  orderStatusLabel,
} from '@/utils/order'

const route = useRoute()

const loading = ref(false)
const acting = ref(false)
const error = ref('')
const actionMessage = ref('')
const order = ref<OrderView | null>(null)

const OPERATION_LABELS: Record<string, string> = {
  CREATE: '创建订单',
  PAY: '支付',
  CANCEL: '取消',
  SHIP: '发货',
  CONFIRM_RECEIPT: '确认收货',
}

function operationLabel(operation: string): string {
  return OPERATION_LABELS[operation] ?? operation
}

function specText(specs: Record<string, string>): string {
  return Object.values(specs ?? {}).join(' / ')
}

async function load(): Promise<void> {
  const orderNo = route.params.orderNo as string
  if (!orderNo) {
    error.value = '订单号缺失'
    return
  }
  loading.value = true
  error.value = ''
  try {
    order.value = await orderApi.detail(orderNo)
  } catch (e) {
    error.value = resolveErrorMessage(e, '订单加载失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

async function onPay(): Promise<void> {
  if (!order.value) return
  acting.value = true
  actionMessage.value = ''
  try {
    order.value = await orderApi.pay(order.value.orderNo)
    actionMessage.value = '支付成功'
  } catch (e) {
    actionMessage.value = resolveErrorMessage(e, '支付失败，请稍后重试')
  } finally {
    acting.value = false
  }
}

async function onCancel(): Promise<void> {
  if (!order.value) return
  const reason = window.prompt('取消原因（可选，直接确定则不填写）')
  if (reason === null) return
  acting.value = true
  actionMessage.value = ''
  try {
    order.value = await orderApi.cancel(order.value.orderNo, reason.trim() || undefined)
    actionMessage.value = '订单已取消，库存已释放'
  } catch (e) {
    actionMessage.value = resolveErrorMessage(e, '取消失败，请稍后重试')
  } finally {
    acting.value = false
  }
}

async function onConfirmReceipt(): Promise<void> {
  if (!order.value) return
  if (!window.confirm('请确认已收到商品，确认后订单将完成。')) return
  acting.value = true
  actionMessage.value = ''
  try {
    order.value = await orderApi.confirmReceipt(order.value.orderNo)
    actionMessage.value = '已确认收货'
  } catch (e) {
    actionMessage.value = resolveErrorMessage(e, '确认收货失败，请稍后重试')
  } finally {
    acting.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.order-detail { max-width: 1000px; margin: 0 auto; }
.head { display: flex; align-items: center; gap: 16px; margin-bottom: 16px; }
.head__back { color: #2563eb; text-decoration: none; font-size: 13px; }
.head__no { font-size: 18px; margin: 0; }
.head__status { color: #dc2626; font-weight: 600; margin-left: auto; }

.actions { display: flex; align-items: center; gap: 12px; background: #fff; border: 1px solid #eee; border-radius: 8px; padding: 14px 20px; margin-bottom: 16px; }
.actions__btn { padding: 8px 28px; border: 1px solid #d1d5db; background: #fff; border-radius: 4px; cursor: pointer; color: #374151; }
.actions__btn--primary { background: #dc2626; border-color: #dc2626; color: #fff; }
.actions__btn:disabled { opacity: 0.6; cursor: not-allowed; }
.actions__msg { color: #059669; font-size: 13px; }

.panel { background: #fff; border: 1px solid #eee; border-radius: 8px; padding: 16px 20px; margin-bottom: 16px; }
.panel h2 { font-size: 15px; margin: 0 0 10px; }
.panel p { margin: 4px 0; color: #4b5563; font-size: 14px; }
.panel__cancel { color: #dc2626 !important; }

.goods-row { display: grid; grid-template-columns: 64px 1fr 100px 60px 110px; gap: 12px; align-items: center; padding: 10px 0; border-bottom: 1px solid #f3f4f6; }
.goods-row__img { width: 64px; height: 64px; object-fit: cover; border-radius: 4px; background: #f5f5f5; }
.goods-row__img--placeholder { border: 1px solid #eee; }
.goods-row__name { font-weight: 500; }
.goods-row__spec { color: #9ca3af; font-size: 12px; }
.goods-row__price, .goods-row__subtotal { color: #dc2626; }
.goods-row__qty { color: #6b7280; }
.amount { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; padding-top: 12px; color: #4b5563; font-size: 14px; }
.amount__pay strong { color: #dc2626; font-size: 20px; }

.timeline { list-style: none; margin: 0; padding: 0; }
.timeline__item { position: relative; display: flex; gap: 12px; padding: 0 0 16px 4px; }
.timeline__item:not(:last-child)::before { content: ''; position: absolute; left: 5px; top: 14px; bottom: -4px; width: 2px; background: #e5e7eb; }
.timeline__dot { width: 10px; height: 10px; border-radius: 50%; background: #2563eb; margin-top: 5px; z-index: 1; }
.timeline__title { font-weight: 500; }
.timeline__op { color: #9ca3af; font-weight: 400; font-size: 13px; }
.timeline__time { color: #9ca3af; font-size: 12px; margin-top: 2px; }
</style>
