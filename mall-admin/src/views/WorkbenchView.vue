<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import { orderApi } from '@/api/order/order'
import type { OrderStatus, OrderSummaryView } from '@/api/order/order'
import { inventoryApi } from '@/api/inventory/inventory'
import type { InventoryItem } from '@/api/inventory/inventory'
import { productApi } from '@/api/product/product'
import { useAppStore } from '@/stores/app'
import { fenToYuan, formatDateTime, statusLabel, statusTagType } from './order/order-display'

const appStore = useAppStore()
const router = useRouter()

const loading = ref(true)
const loadedAt = ref('')

// ---------- 统计数据 ----------

const productTotal = ref<number | null>(null)
const productOnSale = ref<number | null>(null)
const orderTotal = ref<number | null>(null)
const statusCounts = ref<Record<OrderStatus, number | null>>({
  PENDING_PAYMENT: null,
  PAID: null,
  SHIPPED: null,
  COMPLETED: null,
  CANCELLED: null,
})

/** 低库存预警阈值：可用 ≤ 10 视为需补货 */
const LOW_STOCK_THRESHOLD = 10
const lowStockItems = ref<InventoryItem[]>([])
const lowStockScanned = ref(0)

const recentOrders = ref<OrderSummaryView[]>([])

const actionable = computed(() => ({
  pendingPayment: statusCounts.value.PENDING_PAYMENT ?? 0,
  toShip: statusCounts.value.PAID ?? 0,
  lowStock: lowStockItems.value.length,
}))

const statusOrder: OrderStatus[] = ['PENDING_PAYMENT', 'PAID', 'SHIPPED', 'COMPLETED', 'CANCELLED']

const statusBar = computed(() => {
  const total = orderTotal.value ?? 0
  return statusOrder.map((status) => {
    const count = statusCounts.value[status] ?? 0
    return {
      status,
      count,
      label: statusLabel(status),
      percent: total > 0 ? Math.round((count / total) * 100) : 0,
    }
  })
})

async function loadDashboard(): Promise<void> {
  loading.value = true
  const [productAll, productOn, orderAll, pay, ship, shipped, done, cancel, stocks, recent] = await Promise.allSettled([
    productApi.page({ page: 1, size: 1 }),
    productApi.page({ page: 1, size: 1, status: 'ON_SALE' }),
    orderApi.page({ page: 1, size: 1 }),
    orderApi.page({ page: 1, size: 1, status: 'PENDING_PAYMENT' }),
    orderApi.page({ page: 1, size: 1, status: 'PAID' }),
    orderApi.page({ page: 1, size: 1, status: 'SHIPPED' }),
    orderApi.page({ page: 1, size: 1, status: 'COMPLETED' }),
    orderApi.page({ page: 1, size: 1, status: 'CANCELLED' }),
    inventoryApi.page({ page: 1, size: 100 }),
    orderApi.page({ page: 1, size: 5 }),
  ])
  if (productAll.status === 'fulfilled') productTotal.value = productAll.value.total
  if (productOn.status === 'fulfilled') productOnSale.value = productOn.value.total
  if (orderAll.status === 'fulfilled') orderTotal.value = orderAll.value.total
  if (pay.status === 'fulfilled') statusCounts.value.PENDING_PAYMENT = pay.value.total
  if (ship.status === 'fulfilled') statusCounts.value.PAID = ship.value.total
  if (shipped.status === 'fulfilled') statusCounts.value.SHIPPED = shipped.value.total
  if (done.status === 'fulfilled') statusCounts.value.COMPLETED = done.value.total
  if (cancel.status === 'fulfilled') statusCounts.value.CANCELLED = cancel.value.total
  if (stocks.status === 'fulfilled') {
    lowStockScanned.value = stocks.value.total
    lowStockItems.value = stocks.value.records
      .filter((item) => item.availableQuantity <= LOW_STOCK_THRESHOLD)
      .sort((a, b) => a.availableQuantity - b.availableQuantity)
      .slice(0, 5)
  }
  if (recent.status === 'fulfilled') recentOrders.value = recent.value.records
  loadedAt.value = formatDateTime(new Date().toISOString(), '')
  loading.value = false
}

function refresh(): void {
  void loadDashboard()
}

function goOrders(status?: OrderStatus): void {
  void router.push(status ? { path: '/orders/list', query: { status } } : '/orders/list')
}

function goInventory(): void {
  void router.push('/inventory/stocks')
}

function goOrderDetail(orderNo: string): void {
  void router.push({ name: 'OrderDetail', params: { orderNo } })
}

function latestItemText(order: OrderSummaryView): string {
  const first = order.items[0]
  if (!first) return '—'
  const more = order.items.length > 1 ? ` 等 ${order.items.length} 件商品` : ''
  return first.productName + more
}

onMounted(() => {
  void loadDashboard()
})
</script>

<template>
  <section class="workbench-view">
    <header class="workbench-view__header">
      <div>
        <h1 class="workbench-view__title">
          {{ appStore.appName }}
        </h1>
        <p class="workbench-view__desc">
          运营管理控制台 · 订单、商品与库存一统管理
          <span
            v-if="loadedAt"
            class="workbench-view__time"
          >（数据时间 {{ loadedAt }}）</span>
        </p>
      </div>
      <el-button
        :loading="loading"
        data-testid="workbench-refresh"
        @click="refresh"
      >
        刷新数据
      </el-button>
    </header>

    <el-row
      v-loading="loading"
      :gutter="12"
      class="workbench-view__cards"
    >
      <el-col
        :span="6"
        :xs="12"
      >
        <article
          class="stat-card"
          data-testid="stat-products"
          @click="goInventory"
        >
          <span class="stat-card__label">商品总数</span>
          <span class="stat-card__value">{{ productTotal ?? '—' }}</span>
          <span class="stat-card__sub">已上架 {{ productOnSale ?? '—' }}</span>
        </article>
      </el-col>
      <el-col
        :span="6"
        :xs="12"
      >
        <article
          class="stat-card stat-card--accent"
          data-testid="stat-to-ship"
          @click="goOrders('PAID')"
        >
          <span class="stat-card__label">待发货订单</span>
          <span class="stat-card__value">{{ actionable.toShip }}</span>
          <span class="stat-card__sub">订单总数 {{ orderTotal ?? '—' }}</span>
        </article>
      </el-col>
      <el-col
        :span="6"
        :xs="12"
      >
        <article
          class="stat-card"
          data-testid="stat-pending-payment"
          @click="goOrders('PENDING_PAYMENT')"
        >
          <span class="stat-card__label">待付款订单</span>
          <span class="stat-card__value">{{ actionable.pendingPayment }}</span>
          <span class="stat-card__sub">超时未付将自动释放库存</span>
        </article>
      </el-col>
      <el-col
        :span="6"
        :xs="12"
      >
        <article
          class="stat-card"
          :class="{ 'stat-card--warn': actionable.lowStock > 0 }"
          data-testid="stat-low-stock"
          @click="goInventory"
        >
          <span class="stat-card__label">低库存 SKU（≤{{ LOW_STOCK_THRESHOLD }}）</span>
          <span class="stat-card__value">{{ actionable.lowStock }}</span>
          <span class="stat-card__sub">已扫描 {{ lowStockScanned }} 条库存</span>
        </article>
      </el-col>
    </el-row>

    <el-row
      :gutter="12"
      class="workbench-view__panels"
    >
      <el-col
        :span="12"
        :xs="24"
      >
        <article class="workbench-panel">
          <div class="workbench-panel__head">
            <h2 class="workbench-panel__title">
              订单状态分布
            </h2>
            <el-button
              link
              type="primary"
              @click="goOrders()"
            >
              全部订单
            </el-button>
          </div>
          <ul class="status-bars">
            <li
              v-for="bar in statusBar"
              :key="bar.status"
              class="status-bar"
            >
              <div class="status-bar__meta">
                <el-tag
                  :type="statusTagType(bar.status)"
                  size="small"
                >
                  {{ bar.label }}
                </el-tag>
                <span class="status-bar__count">{{ bar.count }}</span>
              </div>
              <div class="status-bar__track">
                <div
                  class="status-bar__fill"
                  :style="{ width: bar.percent + '%' }"
                />
              </div>
            </li>
          </ul>
        </article>
      </el-col>

      <el-col
        :span="12"
        :xs="24"
      >
        <article class="workbench-panel">
          <div class="workbench-panel__head">
            <h2 class="workbench-panel__title">
              低库存预警
            </h2>
            <el-button
              link
              type="primary"
              @click="goInventory"
            >
              库存列表
            </el-button>
          </div>
          <p
            v-if="lowStockItems.length === 0"
            class="workbench-panel__empty"
          >
            暂无低库存 SKU
          </p>
          <ul
            v-else
            class="stock-list"
          >
            <li
              v-for="item in lowStockItems"
              :key="item.skuId"
              class="stock-list__row"
            >
              <div class="stock-list__info">
                <span class="stock-list__name">{{ item.productName ?? '—' }}</span>
                <span class="stock-list__sub">{{ item.skuCode ?? item.skuId }}</span>
              </div>
              <el-tag
                :type="item.availableQuantity <= 0 ? 'danger' : 'warning'"
                size="small"
              >
                可用 {{ item.availableQuantity }}
              </el-tag>
            </li>
          </ul>
        </article>
      </el-col>
    </el-row>

    <article class="workbench-panel">
      <div class="workbench-panel__head">
        <h2 class="workbench-panel__title">
          最近订单
        </h2>
        <el-button
          link
          type="primary"
          @click="goOrders()"
        >
          查看全部
        </el-button>
      </div>
      <el-table
        :data="recentOrders"
        size="small"
        :empty-text="'暂无订单'"
      >
        <el-table-column
          prop="orderNo"
          label="订单号"
          min-width="220"
          show-overflow-tooltip
        />
        <el-table-column
          label="商品"
          min-width="200"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            {{ latestItemText(row as OrderSummaryView) }}
          </template>
        </el-table-column>
        <el-table-column
          label="实付金额"
          width="120"
          align="right"
        >
          <template #default="{ row }">
            ¥{{ fenToYuan((row as OrderSummaryView).payAmountFen) }}
          </template>
        </el-table-column>
        <el-table-column
          label="状态"
          width="110"
          align="center"
        >
          <template #default="{ row }">
            <el-tag
              :type="statusTagType((row as OrderSummaryView).status)"
              size="small"
            >
              {{ statusLabel((row as OrderSummaryView).status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          label="下单时间"
          width="160"
        >
          <template #default="{ row }">
            {{ formatDateTime((row as OrderSummaryView).createdAt) }}
          </template>
        </el-table-column>
        <el-table-column
          label=""
          width="80"
          align="center"
        >
          <template #default="{ row }">
            <el-button
              link
              type="primary"
              @click="goOrderDetail((row as OrderSummaryView).orderNo)"
            >
              详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </article>
  </section>
</template>

<style scoped>
.workbench-view {
  display: flex;
  flex-direction: column;
  gap: var(--admin-space-5);
}

.workbench-view__header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--admin-space-3);
  padding-bottom: var(--admin-space-3);
  border-bottom: 1px solid var(--admin-border-light);
}
.workbench-view__title {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: var(--admin-text);
  letter-spacing: -0.01em;
}
.workbench-view__desc {
  margin: 4px 0 0;
  color: var(--admin-text-tertiary);
  font-size: 13px;
}
.workbench-view__time {
  color: var(--admin-text-placeholder);
}

.workbench-view__cards {
  row-gap: 12px;
}

.stat-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: var(--admin-space-4) var(--admin-space-5);
  background: var(--admin-bg);
  border: 1px solid var(--admin-border-light);
  border-radius: var(--admin-radius-lg);
  cursor: pointer;
  transition: box-shadow 0.15s ease, transform 0.15s ease;
}
.stat-card:hover {
  box-shadow: var(--admin-shadow-sm, 0 2px 8px rgb(0 0 0 / 8%));
  transform: translateY(-1px);
}
.stat-card__label {
  font-size: 13px;
  color: var(--admin-text-tertiary);
}
.stat-card__value {
  font-size: 28px;
  font-weight: 700;
  line-height: 1.2;
  color: var(--admin-text);
  font-variant-numeric: tabular-nums;
}
.stat-card__sub {
  font-size: 12px;
  color: var(--admin-text-placeholder);
}
.stat-card--accent .stat-card__value {
  color: var(--admin-primary, var(--el-color-primary));
}
.stat-card--warn {
  border-color: var(--el-color-warning-light-5);
  background: var(--el-color-warning-light-9);
}
.stat-card--warn .stat-card__value {
  color: var(--el-color-warning);
}

.workbench-view__panels {
  row-gap: 12px;
}

.workbench-panel {
  display: flex;
  flex-direction: column;
  gap: var(--admin-space-3);
  padding: var(--admin-space-5);
  background: var(--admin-bg);
  border: 1px solid var(--admin-border-light);
  border-radius: var(--admin-radius-lg);
}
.workbench-panel__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.workbench-panel__title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--admin-text);
}
.workbench-panel__empty {
  margin: 0;
  padding: var(--admin-space-4) 0;
  text-align: center;
  font-size: 13px;
  color: var(--admin-text-placeholder);
}

.status-bars {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.status-bar__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}
.status-bar__count {
  font-size: 14px;
  font-weight: 600;
  color: var(--admin-text);
  font-variant-numeric: tabular-nums;
}
.status-bar__track {
  height: 8px;
  border-radius: 4px;
  background: var(--admin-fill, var(--el-fill-color-light));
  overflow: hidden;
}
.status-bar__fill {
  height: 100%;
  min-width: 2px;
  border-radius: 4px;
  background: var(--admin-primary, var(--el-color-primary));
  opacity: 0.75;
}

.stock-list {
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  list-style: none;
}
.stock-list__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px dashed var(--admin-border-light);
}
.stock-list__row:last-child {
  border-bottom: none;
}
.stock-list__info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.stock-list__name {
  font-size: 13px;
  font-weight: 500;
  color: var(--admin-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.stock-list__sub {
  font-size: 12px;
  color: var(--admin-text-tertiary);
}
</style>
