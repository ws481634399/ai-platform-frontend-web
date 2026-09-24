<template>
  <div class="admin-page delay-page">
    <div class="delay-page__toolbar">
      <el-form
        :inline="true"
        class="delay-page__filter"
        @submit.prevent
      >
        <el-form-item label="状态">
          <el-select
            v-model="status"
            placeholder="全部状态"
            clearable
            style="width: 160px"
            @change="handleSearch"
          >
            <el-option label="待取消" value="PENDING" />
            <el-option label="已取消" value="CANCELLED" />
            <el-option label="失败" value="FAILED" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            @click="handleSearch"
          >
            查询
          </el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <el-card
      shadow="never"
      body-style="padding: 0"
    >
      <el-table
        v-loading="loading"
        :data="records"
        stripe
      >
        <el-table-column
          prop="orderId"
          label="订单 ID"
          width="120"
          class-name="tabular"
        />
        <el-table-column
          prop="orderNo"
          label="订单号"
          width="180"
          show-overflow-tooltip
        />
        <el-table-column
          label="任务状态"
          width="110"
          align="center"
        >
          <template #default="{ row }">
            <el-tag
              :type="delayStatusTagType((row as DelayTaskView).delayStatus)"
              size="small"
            >
              {{ delayStatusLabel((row as DelayTaskView).delayStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          label="创建时间"
          width="170"
          align="center"
          class-name="tabular"
        >
          <template #default="{ row }">
            {{ formatDateTime((row as DelayTaskView).createdAt) }}
          </template>
        </el-table-column>
        <el-table-column
          label="取消时间"
          width="170"
          align="center"
          class-name="tabular"
        >
          <template #default="{ row }">
            {{ formatDateTime((row as DelayTaskView).cancelledAt) }}
          </template>
        </el-table-column>
        <el-table-column
          prop="lastError"
          label="最近错误"
          min-width="200"
          show-overflow-tooltip
        />
        <el-table-column
          label="操作"
          width="130"
          align="center"
          fixed="right"
        >
          <template #default="{ row }">
            <el-popconfirm
              v-if="(row as DelayTaskView).delayStatus === 'PENDING'"
              title="确认立即取消该订单？"
              confirm-button-text="取消订单"
              cancel-button-text="再想想"
              @confirm="onCancel(row as DelayTaskView)"
            >
              <template #reference>
                <el-button
                  v-permission="'order-delay:cancel'"
                  link
                  type="warning"
                  :loading="cancellingId === (row as DelayTaskView).orderId"
                  data-testid="delay-cancel"
                >
                  手动取消
                </el-button>
              </template>
            </el-popconfirm>
            <span v-else class="delay-page__no-action">—</span>
          </template>
        </el-table-column>
        <template #empty>
          <div class="delay-page__empty">暂无延迟取消任务</div>
        </template>
      </el-table>

      <div class="admin-pager">
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
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { delayTaskApi, type DelayTaskStatus, type DelayTaskView } from '@/api/distributed'
import { formatDateTime } from '@/views/order/order-display'
import { delayStatusLabel, delayStatusTagType } from './delay-display'

const loading = ref(false)
const records = ref<DelayTaskView[]>([])
const total = ref(0)
const page = ref(1)
const size = ref(20)
const status = ref<DelayTaskStatus | undefined>(undefined)
const cancellingId = ref<number | null>(null)

async function loadPage(): Promise<void> {
  loading.value = true
  try {
    const view = await delayTaskApi.page({
      status: status.value,
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
  status.value = undefined
  page.value = 1
  void loadPage()
}

function handleSizeChange(): void {
  page.value = 1
  void loadPage()
}

async function onCancel(row: DelayTaskView): Promise<void> {
  cancellingId.value = row.orderId
  try {
    await delayTaskApi.cancel(row.orderId)
    ElMessage.success('已取消订单')
    await loadPage()
  } catch {
    // 错误文案由拦截器统一提示
  } finally {
    cancellingId.value = null
  }
}

onMounted(() => {
  void loadPage()
})
</script>

<style scoped>
.delay-page__toolbar {
  background: var(--admin-bg);
  border: 1px solid var(--admin-border-light);
  border-radius: var(--admin-radius-lg);
  padding: var(--admin-space-3) var(--admin-space-4);
}

.delay-page__filter {
  display: flex;
  flex-wrap: wrap;
  margin: 0;
}

.delay-page__empty {
  padding: var(--admin-space-6);
  color: var(--admin-text-tertiary);
  font-size: 13px;
  text-align: center;
}

.delay-page__no-action {
  color: var(--admin-text-tertiary);
}
</style>
