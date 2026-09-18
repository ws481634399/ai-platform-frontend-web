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
              订单号 <span class="tabular">{{ order.orderNo }}</span>
            </h1>
            <span
              class="head__status"
              :class="`head__status--${order.status}`"
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
              class="action-btn action-btn--primary"
              :disabled="acting"
              data-testid="action-pay"
              @click="onPay"
            >
              立即支付
            </button>
            <button
              v-if="canCancel(order.status)"
              type="button"
              class="action-btn"
              :disabled="acting"
              data-testid="action-cancel"
              @click="onCancel"
            >
              取消订单
            </button>
            <button
              v-if="canConfirmReceipt(order.status)"
              type="button"
              class="action-btn action-btn--primary"
              :disabled="acting"
              data-testid="action-confirm"
              @click="onConfirmReceipt"
            >
              确认收货
            </button>
            <transition name="fade">
              <span
                v-if="actionMessage"
                class="actions__msg"
                data-testid="action-message"
              >{{ actionMessage }}</span>
            </transition>
          </div>

          <!-- 收货信息 -->
          <section
            v-if="order.receiver"
            class="panel"
          >
            <h2 class="panel__title">
              收货信息
            </h2>
            <p class="panel__line">
              <span class="panel__label">收货人</span>
              <span>{{ order.receiver.receiverName }} {{ order.receiver.receiverPhone }}</span>
            </p>
            <p class="panel__line">
              <span class="panel__label">地址</span>
              <span>{{ order.receiver.province }}{{ order.receiver.city }}{{ order.receiver.district }}
                {{ order.receiver.detailAddress }}</span>
              <template v-if="order.receiver.postalCode">
                <span class="panel__postal">（{{ order.receiver.postalCode }}）</span>
              </template>
            </p>
            <p
              v-if="order.deliveryCompany || order.trackingNo"
              class="panel__line"
            >
              <span class="panel__label">物流</span>
              <span>{{ order.deliveryCompany ?? '—' }} / 运单号 {{ order.trackingNo ?? '—' }}</span>
            </p>
            <p
              v-if="order.cancelReason"
              class="panel__line panel__line--danger"
            >
              <span class="panel__label">取消原因</span>
              <span>{{ order.cancelReason }}</span>
            </p>
          </section>

          <!-- 商品清单 -->
          <section class="panel">
            <h2 class="panel__title">
              商品清单
            </h2>
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
            <div class="amount">
              <div class="amount__row">
                <span>商品总额</span>
                <span class="tabular">¥{{ fenToYuan(order.goodsAmountFen) }}</span>
              </div>
              <div class="amount__row">
                <span>运费</span>
                <span class="tabular">¥{{ fenToYuan(order.freightAmountFen) }}</span>
              </div>
              <div class="amount__row amount__row--pay">
                <span>实付</span>
                <strong class="tabular">¥{{ fenToYuan(order.payAmountFen) }}</strong>
              </div>
            </div>
          </section>

          <!-- 状态轨迹 -->
          <section class="panel">
            <h2 class="panel__title">
              状态轨迹
            </h2>
            <ul
              class="timeline"
              data-testid="order-timeline"
            >
              <li
                v-for="(node, idx) in order.statusHistory"
                :key="`${node.operation}-${node.occurredAt}-${idx}`"
                class="timeline__item"
                :class="{ 'timeline__item--current': idx === order.statusHistory.length - 1 }"
              >
                <span class="timeline__dot" />
                <div class="timeline__body">
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
.order-detail {
  max-width: 1000px;
  margin: 0 auto;
}

/* ── 头部 ─────────────────────────────── */
.head {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
  flex-wrap: wrap;
}
.head__back {
  color: var(--color-text-tertiary);
  font-size: var(--text-sm);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
}
.head__back:hover {
  color: var(--color-text);
  background: var(--color-bg-muted);
}
.head__no {
  margin: 0;
  font-size: var(--text-xl);
  font-weight: 700;
  color: var(--color-text);
}
.head__no span {
  font-weight: 600;
}
.head__status {
  margin-left: auto;
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-sm);
  font-weight: 600;
  font-size: var(--text-sm);
}
.head__status--PENDING_PAYMENT {
  background: var(--color-warning-bg);
  color: var(--color-warning);
}
.head__status--PAID,
.head__status--SHIPPED {
  background: var(--color-accent-bg);
  color: var(--color-accent);
}
.head__status--COMPLETED {
  background: var(--color-success-bg);
  color: var(--color-success);
}
.head__status--CANCELLED {
  background: var(--color-info-bg);
  color: var(--color-info);
}

/* ── 操作区 ──────────────────────────── */
.actions {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-3) var(--space-4);
  margin-bottom: var(--space-4);
  flex-wrap: wrap;
}
.actions__msg {
  color: var(--color-success);
  font-size: var(--text-sm);
  margin-left: var(--space-2);
}

.action-btn {
  padding: var(--space-2) var(--space-5);
  border: 1px solid var(--color-border-strong);
  background: var(--color-bg);
  border-radius: var(--radius-md);
  cursor: pointer;
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
  font-weight: 500;
  transition: all var(--transition-fast);
}
.action-btn:hover:not(:disabled) {
  border-color: var(--color-text);
  color: var(--color-text);
}
.action-btn--primary {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: var(--color-text-on-primary);
}
.action-btn--primary:hover:not(:disabled) {
  background: var(--color-primary-hover);
  border-color: var(--color-primary-hover);
  color: var(--color-text-on-primary);
}
.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ── Panel ───────────────────────────── */
.panel {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-4) var(--space-5);
  margin-bottom: var(--space-4);
}
.panel__title {
  margin: 0 0 var(--space-3);
  font-size: var(--text-md);
  font-weight: 600;
  color: var(--color-text);
}
.panel__line {
  margin: var(--space-1) 0;
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
  display: flex;
  gap: var(--space-2);
}
.panel__label {
  color: var(--color-text-tertiary);
  min-width: 64px;
}
.panel__line--danger {
  color: var(--color-danger);
}

/* ── 商品行 ─────────────────────────── */
.goods-row {
  display: grid;
  grid-template-columns: 80px 1fr 100px 60px 110px;
  gap: var(--space-3);
  align-items: center;
  padding: var(--space-3) 0;
  border-bottom: 1px solid var(--color-border);
}
.goods-row:last-of-type {
  border-bottom: none;
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
.goods-row__price {
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
}
.goods-row__qty {
  color: var(--color-text-tertiary);
  font-size: var(--text-sm);
}
.goods-row__subtotal {
  color: var(--color-price);
  font-weight: 600;
  font-size: var(--text-sm);
}

/* ── 金额 ────────────────────────────── */
.amount {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--space-1);
  padding-top: var(--space-3);
  margin-top: var(--space-2);
  border-top: 1px solid var(--color-border);
}
.amount__row {
  display: flex;
  justify-content: space-between;
  width: 240px;
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
}
.amount__row--pay {
  color: var(--color-text);
  font-size: var(--text-md);
  font-weight: 600;
}
.amount__row--pay strong {
  color: var(--color-price);
  font-size: var(--text-xl);
  font-weight: 700;
}

/* ── 时间线 ──────────────────────────── */
.timeline {
  list-style: none;
  margin: 0;
  padding: 0;
}
.timeline__item {
  position: relative;
  display: flex;
  gap: var(--space-3);
  padding: 0 0 var(--space-4) var(--space-1);
}
.timeline__item:not(:last-child)::before {
  content: '';
  position: absolute;
  left: 4px;
  top: 14px;
  bottom: -4px;
  width: 1px;
  background: var(--color-border);
}
.timeline__dot {
  width: 10px;
  height: 10px;
  border-radius: var(--radius-pill);
  background: var(--color-border-strong);
  margin-top: 4px;
  z-index: 1;
  flex-shrink: 0;
}
.timeline__item--current .timeline__dot {
  background: var(--color-text);
}
.timeline__title {
  font-weight: 500;
  color: var(--color-text);
  font-size: var(--text-sm);
}
.timeline__op {
  color: var(--color-text-tertiary);
  font-weight: 400;
  font-size: var(--text-xs);
}
.timeline__time {
  color: var(--color-text-tertiary);
  font-size: var(--text-xs);
  margin-top: var(--space-1);
}

/* ── 过渡 ────────────────────────────── */
.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--transition-fast);
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
