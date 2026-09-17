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
          暂无订单
        </div>
      </template>

      <div
        v-for="order in records"
        :key="order.orderNo"
        class="order-card"
        :data-testid="`order-card-${order.orderNo}`"
      >
        <div class="order-card__head">
          <span class="order-card__no">{{ order.orderNo }}</span>
          <span class="order-card__time">{{ formatDateTime(order.createdAt) }}</span>
          <span
            class="order-card__status"
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
          <div class="order-card__price">
            ¥{{ fenToYuan(item.unitPriceFen) }}
          </div>
          <div class="order-card__qty">
            ×{{ item.quantity }}
          </div>
        </div>
        <div class="order-card__foot">
          <span class="order-card__total">
            合计 <strong>¥{{ fenToYuan(order.payAmountFen) }}</strong>
          </span>
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
            class="order-card__btn order-card__btn--primary"
            data-testid="order-pay-btn"
            @click="goPay(order.orderNo)"
          >
            立即支付
          </button>
          <button
            v-if="canCancel(order.status)"
            type="button"
            class="order-card__btn"
            data-testid="order-cancel-btn"
            @click="goDetail(order.orderNo)"
          >
            取消订单
          </button>
          <button
            v-if="canConfirmReceipt(order.status)"
            type="button"
            class="order-card__btn order-card__btn--primary"
            data-testid="order-confirm-btn"
            @click="goDetail(order.orderNo)"
          >
            确认收货
          </button>
        </div>
      </div>

      <div
        v-if="total > size"
        class="pager"
      >
        <button
          type="button"
          :disabled="page <= 1 || loading"
          @click="changePage(page - 1)"
        >
          上一页
        </button>
        <span>{{ page }} / {{ totalPages }}</span>
        <button
          type="button"
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
.order-list { max-width: 1000px; margin: 0 auto; }
.order-list__title { font-size: 20px; margin-bottom: 16px; }
.tabs { display: flex; gap: 8px; border-bottom: 1px solid #e5e7eb; margin-bottom: 16px; }
.tabs__item { padding: 8px 18px; border: none; background: none; cursor: pointer; color: #4b5563; font-size: 14px; border-bottom: 2px solid transparent; }
.tabs__item--active { color: #dc2626; border-bottom-color: #dc2626; font-weight: 600; }
.order-list__empty { padding: 48px; text-align: center; color: #9ca3af; }

.order-card { background: #fff; border: 1px solid #eee; border-radius: 8px; margin-bottom: 12px; }
.order-card__head { display: flex; align-items: center; gap: 16px; padding: 10px 16px; background: #f9fafb; border-radius: 8px 8px 0 0; font-size: 13px; color: #6b7280; }
.order-card__no { font-weight: 600; color: #374151; }
.order-card__status { margin-left: auto; color: #dc2626; font-weight: 500; }
.order-card__item { display: grid; grid-template-columns: 64px 1fr 100px 60px; gap: 12px; align-items: center; padding: 12px 16px; border-bottom: 1px solid #f3f4f6; }
.order-card__img { width: 64px; height: 64px; object-fit: cover; border-radius: 4px; background: #f5f5f5; }
.order-card__img--placeholder { border: 1px solid #eee; }
.order-card__name { font-size: 14px; }
.order-card__price { color: #dc2626; }
.order-card__foot { display: flex; align-items: center; gap: 12px; justify-content: flex-end; padding: 12px 16px; }
.order-card__total { color: #4b5563; }
.order-card__total strong { color: #dc2626; font-size: 18px; }
.order-card__detail { color: #2563eb; text-decoration: none; font-size: 13px; }
.order-card__btn { padding: 6px 18px; border: 1px solid #d1d5db; background: #fff; border-radius: 4px; cursor: pointer; color: #374151; }
.order-card__btn--primary { background: #dc2626; border-color: #dc2626; color: #fff; }
.pager { display: flex; align-items: center; justify-content: center; gap: 16px; padding: 16px 0; color: #6b7280; }
.pager button { padding: 4px 14px; border: 1px solid #d1d5db; background: #fff; border-radius: 4px; cursor: pointer; }
.pager button:disabled { color: #d1d5db; cursor: not-allowed; }
</style>
