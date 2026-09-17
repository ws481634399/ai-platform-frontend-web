<template>
  <div class="compensation-page">
    <el-card
      class="filter-card"
      shadow="never"
    >
      <el-form
        :inline="true"
        @submit.prevent
      >
        <el-form-item label="任务状态">
          <el-select
            v-model="status"
            placeholder="全部状态"
            clearable
            style="width: 200px"
            @change="handleSearch"
          >
            <el-option
              label="待处理"
              value="PENDING"
            />
            <el-option
              label="已成功"
              value="SUCCESS"
            />
            <el-option
              label="已失败（人工介入）"
              value="FAILED_DEAD"
            />
          </el-select>
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
          prop="id"
          label="任务 ID"
          width="200"
        />
        <el-table-column
          prop="businessId"
          label="业务单号"
          width="230"
        />
        <el-table-column
          label="操作类型"
          width="140"
          align="center"
        >
          <template #default="{ row }">
            {{ operationBizLabel((row as CompensationView).operation) }}
          </template>
        </el-table-column>
        <el-table-column
          label="重试进度"
          width="110"
          align="center"
        >
          <template #default="{ row }">
            {{ (row as CompensationView).retryCount }}/{{ (row as CompensationView).maxRetries }}
          </template>
        </el-table-column>
        <el-table-column
          label="状态"
          width="150"
          align="center"
        >
          <template #default="{ row }">
            <el-tag :type="compTagType((row as CompensationView).status)">
              {{ compensationStatusLabel((row as CompensationView).status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="lastError"
          label="最近错误"
          min-width="220"
          show-overflow-tooltip
        />
        <el-table-column
          label="下次重试"
          width="170"
          align="center"
        >
          <template #default="{ row }">
            {{ formatDateTime((row as CompensationView).nextRetryAt) }}
          </template>
        </el-table-column>
        <el-table-column
          label="更新时间"
          width="170"
          align="center"
        >
          <template #default="{ row }">
            {{ formatDateTime((row as CompensationView).updatedAt) }}
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
              v-if="canRetry((row as CompensationView).status)"
              link
              type="primary"
              :loading="retryingId === (row as CompensationView).id"
              data-testid="compensation-retry"
              @click="onRetry(row as CompensationView)"
            >
              手动重试
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
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { compensationApi, type CompensationStatus, type CompensationView } from '@/api/order/order'
import { compensationStatusLabel, formatDateTime, operationBizLabel } from './order-display'

const loading = ref(false)
const records = ref<CompensationView[]>([])
const total = ref(0)
const page = ref(1)
const size = ref(20)
const status = ref<CompensationStatus | undefined>(undefined)
const retryingId = ref<string | null>(null)

function compTagType(s: string): 'warning' | 'success' | 'danger' {
  if (s === 'SUCCESS') return 'success'
  if (s === 'FAILED_DEAD') return 'danger'
  return 'warning'
}

function canRetry(s: string): boolean {
  return s === 'PENDING' || s === 'FAILED_DEAD'
}

async function loadPage(): Promise<void> {
  loading.value = true
  try {
    const view = await compensationApi.page({
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

async function onRetry(row: CompensationView): Promise<void> {
  retryingId.value = row.id
  try {
    await compensationApi.retry(row.id)
    ElMessage.success('重试指令已执行')
    await loadPage()
  } catch {
    // 错误文案由拦截器统一提示
  } finally {
    retryingId.value = null
  }
}

onMounted(() => {
  void loadPage()
})
</script>

<style scoped>
.compensation-page {
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
