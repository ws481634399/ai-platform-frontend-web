<template>
  <div class="order-list">
    <h1 class="order-list__title">
      我的订单
    </h1>

    <div
      class="tabs"
      data-testid="order-status-tabs"
    >
      <button
        v-for="tab in ORDER_STATUS_FILTERS"
        :key="tab.value"
        type="button"
        class="tabs__item"
        :class="{ 'tabs__item--active': activeStatus === tab.value }"
        :data-testid="`order-tab-${tab.value || 'ALL'}`"
        @click="switchTab(tab.value)"
      >
        {{ tab.label }}
      </button>
    </div>

    <StateView
      :loading="loading"
      :error="error"
      :is-empty="records.length === 0"
      @retry="loadPage"
    >
      <template #empty>
        <div class="order-list__empty">
          <p class="order-list__empty-text">
            暂无订单
          </p>
          <router-link
            to="/products"
            class="order-list__empty-action"
          >
            去逛逛
          </router-link>
        </div>
      </template>

      <div
        v-for="order in records"
        :key="order.orderNo"
        class="order-card"
        :data-testid="`order-card-${order.orderNo}`"
      >
        <div class="order-card__head">
          <span class="order-card__no tabular">{{ order.orderNo }}</span>
          <span class="order-card__time">{{ formatDateTime(order.createdAt) }}</span>
          <span
            class="order-card__status"
            :class="`order-card__status--${order.status}`"
            :data-testid="`order-status-${order.orderNo}`"
          >{{ orderStatusLabel(order.status) }}</span>
        </div>
        <div
          v-for="item in order.items"
          :key="item.skuId"
          class="order-card__item"
        >
          <img
            v-if="item.mainImageUrl"
            :src="item.mainImageUrl"
            class="order-card__img"
            alt=""
          >
          <div
            v-else
            class="order-card__img order-card__img--placeholder"
          />
          <div class="order-card__meta">
            <div class="order-card__name">
              {{ item.productName }}
            </div>
          </div>
          <div class="order-card__price tabular">
            ¥{{ fenToYuan(item.unitPriceFen) }}
          </div>
          <div class="order-card__qty">
            ×{{ item.quantity }}
          </div>
        </div>
        <div class="order-card__foot">
          <span class="order-card__total">
            合计 <strong class="tabular">¥{{ fenToYuan(order.payAmountFen) }}</strong>
          </span>
          <div class="order-card__actions">
            <router-link
              :to="`/orders/${encodeURIComponent(order.orderNo)}`"
              class="order-card__detail"
              data-testid="order-detail-link"
            >
              订单详情
            </router-link>
            <button
              v-if="canPay(order.status)"
              type="button"
              class="action-btn action-btn--primary"
              data-testid="order-pay-btn"
              @click="goPay(order.orderNo)"
            >
              立即支付
            </button>
            <button
              v-if="canCancel(order.status)"
              type="button"
              class="action-btn"
              data-testid="order-cancel-btn"
              @click="goDetail(order.orderNo)"
            >
              取消订单
            </button>
            <button
              v-if="canConfirmReceipt(order.status)"
              type="button"
              class="action-btn action-btn--primary"
              data-testid="order-confirm-btn"
              @click="goDetail(order.orderNo)"
            >
              确认收货
            </button>
          </div>
        </div>
      </div>

      <div
        v-if="total > size"
        class="pager"
      >
        <button
          type="button"
          class="pager__btn"
          :disabled="page <= 1 || loading"
          @click="changePage(page - 1)"
        >
          上一页
        </button>
        <span class="pager__info">
          <span class="pager__current">{{ page }}</span>
          <span class="pager__sep">/</span>
          <span>{{ totalPages }}</span>
        </span>
        <button
          type="button"
          class="pager__btn"
          :disabled="page >= totalPages || loading"
          @click="changePage(page + 1)"
        >
          下一页
        </button>
      </div>
    </StateView>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import StateView from '@/components/StateView.vue'
import { orderApi } from '@/api/order'
import type { OrderStatus, OrderSummaryView } from '@/types/order'
import {
  ORDER_STATUS_FILTERS,
  canCancel,
  canConfirmReceipt,
  canPay,
  fenToYuan,
  formatDateTime,
  orderStatusLabel,
} from '@/utils/order'

const route = useRoute()
const router = useRouter()

const PAGE_SIZE = 10
const loading = ref(false)
const error = ref('')
const records = ref<OrderSummaryView[]>([])
const total = ref(0)
const page = ref(1)
const size = ref(PAGE_SIZE)
const activeStatus = ref<'' | OrderStatus>('')

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / size.value)))

async function loadPage(): Promise<void> {
  loading.value = true
  error.value = ''
  try {
    const view = await orderApi.page({
      status: activeStatus.value || undefined,
      page: page.value,
      size: size.value,
    })
    records.value = view.records
    total.value = view.total
    page.value = view.page
    size.value = view.size
  } catch {
    error.value = '订单加载失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

function switchTab(status: '' | OrderStatus): void {
  activeStatus.value = status
  page.value = 1
  void loadPage()
}

function changePage(next: number): void {
  page.value = next
  void loadPage()
}

function goDetail(orderNo: string): void {
  void router.push(`/orders/${encodeURIComponent(orderNo)}`)
}

function goPay(orderNo: string): void {
  void router.push(`/orders/${encodeURIComponent(orderNo)}`)
}

onMounted(() => {
  const raw = route.query.status
  if (typeof raw === 'string' && ORDER_STATUS_FILTERS.some((tab) => tab.value === raw)) {
    activeStatus.value = raw as OrderStatus
  }
  void loadPage()
})
</script>

<style scoped>
.order-list {
  max-width: 1000px;
  margin: 0 auto;
}
.order-list__title {
  margin: 0 0 var(--space-6);
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--color-text);
  letter-spacing: var(--tracking-tight);
}

/* ── Tabs ─────────────────────────────── */
.tabs {
  display: flex;
  gap: var(--space-1);
  border-bottom: 1px solid var(--color-border);
  margin-bottom: var(--space-5);
}
.tabs__item {
  padding: var(--space-3) var(--space-4);
  border: none;
  background: none;
  cursor: pointer;
  color: var(--color-text-tertiary);
  font-size: var(--text-sm);
  font-weight: 500;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  transition: all var(--transition-fast);
}
.tabs__item:hover {
  color: var(--color-text);
}
.tabs__item--active {
  color: var(--color-text);
  border-bottom-color: var(--color-text);
  font-weight: 600;
}

.order-list__empty {
  padding: var(--space-12) var(--space-4);
  text-align: center;
}
.order-list__empty-text {
  margin: 0 0 var(--space-3);
  color: var(--color-text-tertiary);
  font-size: var(--text-base);
}
.order-list__empty-action {
  display: inline-block;
  padding: var(--space-2) var(--space-4);
  border: 1px solid var(--color-text);
  border-radius: var(--radius-md);
  color: var(--color-text);
  font-size: var(--text-sm);
}

/* ── 订单卡 ───────────────────────────── */
.order-card {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  margin-bottom: var(--space-3);
  overflow: hidden;
}
.order-card__head {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-3) var(--space-4);
  background: var(--color-bg-subtle);
  border-bottom: 1px solid var(--color-border);
  font-size: var(--text-sm);
  color: var(--color-text-tertiary);
}
.order-card__no {
  font-weight: 600;
  color: var(--color-text);
}
.order-card__time {
  color: var(--color-text-tertiary);
  font-size: var(--text-xs);
}
.order-card__status {
  margin-left: auto;
  font-weight: 600;
  font-size: var(--text-sm);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
}
/* 状态色：克制、按语义 */
.order-card__status--PENDING_PAYMENT {
  background: var(--color-warning-bg);
  color: var(--color-warning);
}
.order-card__status--PAID {
  background: var(--color-accent-bg);
  color: var(--color-accent);
}
.order-card__status--SHIPPED {
  background: var(--color-accent-bg);
  color: var(--color-accent);
}
.order-card__status--COMPLETED {
  background: var(--color-success-bg);
  color: var(--color-success);
}
.order-card__status--CANCELLED {
  background: var(--color-info-bg);
  color: var(--color-info);
}

.order-card__item {
  display: grid;
  grid-template-columns: 80px 1fr 100px 60px;
  gap: var(--space-3);
  align-items: center;
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--color-border);
}
.order-card__item:last-of-type {
  border-bottom: none;
}
.order-card__img {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: var(--radius-md);
  background: var(--color-bg-muted);
}
.order-card__img--placeholder {
  border: 1px solid var(--color-border);
}
.order-card__name {
  font-size: var(--text-sm);
  color: var(--color-text);
}
.order-card__price {
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
}
.order-card__qty {
  color: var(--color-text-tertiary);
  font-size: var(--text-sm);
}
.order-card__foot {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  justify-content: flex-end;
  padding: var(--space-3) var(--space-4);
  background: var(--color-bg-subtle);
  border-top: 1px solid var(--color-border);
  flex-wrap: wrap;
}
.order-card__total {
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
  margin-right: auto;
}
.order-card__total strong {
  color: var(--color-price);
  font-size: var(--text-md);
  font-weight: 700;
}
.order-card__actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}
.order-card__detail {
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
}
.order-card__detail:hover {
  background: var(--color-bg-muted);
  color: var(--color-text);
}

/* ── 按钮 ─────────────────────────────── */
.action-btn {
  padding: var(--space-2) var(--space-4);
  border: 1px solid var(--color-border-strong);
  background: var(--color-bg);
  border-radius: var(--radius-md);
  cursor: pointer;
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
  font-weight: 500;
  transition: all var(--transition-fast);
}
.action-btn:hover {
  border-color: var(--color-text);
  color: var(--color-text);
}
.action-btn--primary {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: var(--color-text-on-primary);
}
.action-btn--primary:hover {
  background: var(--color-primary-hover);
  border-color: var(--color-primary-hover);
  color: var(--color-text-on-primary);
}

/* ── Pager ────────────────────────────── */
.pager {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  padding: var(--space-4) 0;
  color: var(--color-text-tertiary);
}
.pager__btn {
  padding: var(--space-2) var(--space-4);
  border: 1px solid var(--color-border);
  background: var(--color-bg);
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  transition: all var(--transition-fast);
}
.pager__btn:hover:not(:disabled) {
  border-color: var(--color-border-strong);
  color: var(--color-text);
}
.pager__btn:disabled {
  color: var(--color-text-muted);
  cursor: not-allowed;
}
.pager__info {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  font-variant-numeric: tabular-nums;
}
.pager__current {
  color: var(--color-text);
  font-weight: 600;
}
.pager__sep {
  color: var(--color-text-muted);
  margin: 0 var(--space-1);
}
</style>
