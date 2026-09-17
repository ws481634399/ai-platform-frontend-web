<template>
  <div class="order-page">
    <el-card
      class="filter-card"
      shadow="never"
    >
      <el-form
        :inline="true"
        @submit.prevent
      >
        <el-form-item label="订单号">
          <el-input
            v-model="filters.orderNo"
            placeholder="按订单号查询"
            clearable
            style="width: 220px"
            @keyup.enter="handleSearch"
            @clear="handleSearch"
          />
        </el-form-item>
        <el-form-item label="会员 ID">
          <el-input
            v-model="filters.memberId"
            placeholder="雪花 ID"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
            @clear="handleSearch"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="filters.status"
            placeholder="全部状态"
            clearable
            style="width: 150px"
            @change="handleSearch"
          >
            <el-option
              v-for="opt in STATUS_OPTIONS"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="下单时间">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            @change="handleSearch"
          />
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            @click="handleSearch"
          >
            查询
          </el-button>
          <el-button @click="handleReset">
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never">
      <el-table
        v-loading="loading"
        :data="records"
        border
        stripe
      >
        <el-table-column
          prop="orderNo"
          label="订单号"
          width="230"
        />
        <el-table-column
          label="商品"
          min-width="220"
        >
          <template #default="{ row }">
            <span
              v-for="(item, idx) in (row as OrderSummaryView).items"
              :key="item.skuId"
            >
              {{ item.productName }} ×{{ item.quantity }}<span v-if="idx < (row as OrderSummaryView).items.length - 1">，</span>
            </span>
          </template>
        </el-table-column>
        <el-table-column
          label="来源"
          width="90"
          align="center"
        >
          <template #default="{ row }">
            {{ (row as OrderSummaryView).source === 'BUY_NOW' ? '立即购买' : '购物车' }}
          </template>
        </el-table-column>
        <el-table-column
          label="应付金额"
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
            <el-tag :type="statusTagType((row as OrderSummaryView).status)">
              {{ statusLabel((row as OrderSummaryView).status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          label="下单时间"
          width="170"
          align="center"
        >
          <template #default="{ row }">
            {{ formatDateTime((row as OrderSummaryView).createdAt) }}
          </template>
        </el-table-column>
        <el-table-column
          label="操作"
          width="100"
          align="center"
          fixed="right"
        >
          <template #default="{ row }">
            <el-button
              v-if="has('order:view')"
              link
              type="primary"
              @click="goDetail((row as OrderSummaryView).orderNo)"
            >
              查看
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pager">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="size"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @current-change="loadPage"
          @size-change="handleSizeChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { orderApi, type OrderStatus, type OrderSummaryView } from '@/api/order/order'
import { usePermission } from '@/composables/usePermission'
import { fenToYuan, formatDateTime, statusLabel, statusTagType } from './order-display'

const router = useRouter()
const { has } = usePermission()

const STATUS_OPTIONS: Array<{ value: OrderStatus; label: string }> = [
  { value: 'PENDING_PAYMENT', label: '待付款' },
  { value: 'PAID', label: '待发货' },
  { value: 'SHIPPED', label: '待收货' },
  { value: 'COMPLETED', label: '已完成' },
  { value: 'CANCELLED', label: '已取消' },
]

const loading = ref(false)
const records = ref<OrderSummaryView[]>([])
const total = ref(0)
const page = ref(1)
const size = ref(20)
const dateRange = ref<[string, string] | null>(null)

const filters = reactive<{ orderNo: string | undefined; memberId: string | undefined; status: OrderStatus | undefined }>({
  orderNo: undefined,
  memberId: undefined,
  status: undefined,
})

async function loadPage(): Promise<void> {
  loading.value = true
  try {
    const view = await orderApi.page({
      orderNo: filters.orderNo?.trim() || undefined,
      memberId: filters.memberId?.trim() || undefined,
      status: filters.status,
      startAt: dateRange.value?.[0] ? `${dateRange.value[0]}T00:00:00Z` : undefined,
      endAt: dateRange.value?.[1] ? `${dateRange.value[1]}T23:59:59Z` : undefined,
      page: page.value,
      size: size.value,
    })
    records.value = view.records
    total.value = view.total
  } catch {
    // 错误文案由拦截器统一提示
  } finally {
    loading.value = false
  }
}

function handleSearch(): void {
  page.value = 1
  void loadPage()
}

function handleReset(): void {
  filters.orderNo = undefined
  filters.memberId = undefined
  filters.status = undefined
  dateRange.value = null
  page.value = 1
  void loadPage()
}

function handleSizeChange(): void {
  page.value = 1
  void loadPage()
}

function goDetail(orderNo: string): void {
  void router.push({ name: 'OrderDetail', params: { orderNo } })
}

onMounted(() => {
  void loadPage()
})
</script>

<style scoped>
.order-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
