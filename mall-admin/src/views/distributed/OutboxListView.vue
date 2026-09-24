<template>
  <div class="admin-page outbox-page">
    <div class="outbox-page__toolbar">
      <el-form
        :inline="true"
        class="outbox-page__filter"
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
            <el-option label="待投递" value="PENDING" />
            <el-option label="投递中" value="SENDING" />
            <el-option label="已投递" value="SENT" />
            <el-option label="已失败" value="FAILED" />
          </el-select>
        </el-form-item>
        <el-form-item label="事件类型">
          <el-input
            v-model="eventType"
            placeholder="如 ORDER_CREATED"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="聚合 ID">
          <el-input
            v-model="aggregateId"
            placeholder="如订单号"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
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
          prop="id"
          label="ID"
          width="100"
          class-name="tabular"
        />
        <el-table-column
          prop="aggregateId"
          label="聚合 ID"
          width="180"
          show-overflow-tooltip
        />
        <el-table-column
          prop="eventType"
          label="事件类型"
          width="180"
        />
        <el-table-column
          label="状态"
          width="100"
          align="center"
        >
          <template #default="{ row }">
            <el-tag
              :type="statusTagType((row as OutboxView).status)"
              size="small"
            >
              {{ statusLabel((row as OutboxView).status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          label="重试次数"
          width="90"
          align="center"
          class-name="tabular"
        >
          <template #default="{ row }">
            {{ (row as OutboxView).retryCount }}
          </template>
        </el-table-column>
        <el-table-column
          prop="lastError"
          label="最近错误"
          min-width="200"
          show-overflow-tooltip
        />
        <el-table-column
          label="创建时间"
          width="170"
          align="center"
          class-name="tabular"
        >
          <template #default="{ row }">
            {{ formatDateTime((row as OutboxView).createdAt) }}
          </template>
        </el-table-column>
        <el-table-column
          label="操作"
          width="160"
          align="center"
          fixed="right"
        >
          <template #default="{ row }">
            <el-button
              link
              type="primary"
              @click="showPayload(row as OutboxView)"
            >
              详情
            </el-button>
            <el-button
              v-if="(row as OutboxView).status === 'FAILED'"
              v-permission="'system:outbox:retry'"
              link
              type="warning"
              :loading="retryingId === (row as OutboxView).id"
              data-testid="outbox-retry"
              @click="onRetry(row as OutboxView)"
            >
              重投
            </el-button>
          </template>
        </el-table-column>
        <template #empty>
          <div class="outbox-page__empty">暂无 Outbox 事件</div>
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

    <el-dialog
      v-model="payloadVisible"
      title="事件 Payload"
      width="640px"
    >
      <pre class="outbox-page__payload">{{ currentPayload }}</pre>
      <div class="outbox-page__meta">
        <div>traceId: {{ currentRow?.traceId ?? '—' }}</div>
        <div>sentAt: {{ formatDateTime(currentRow?.sentAt ?? null) }}</div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { outboxApi, type OutboxStatus, type OutboxView } from '@/api/distributed'
import { formatDateTime } from '@/views/order/order-display'

const loading = ref(false)
const records = ref<OutboxView[]>([])
const total = ref(0)
const page = ref(1)
const size = ref(20)
const status = ref<OutboxStatus | undefined>(undefined)
const eventType = ref('')
const aggregateId = ref('')
const retryingId = ref<number | null>(null)

const payloadVisible = ref(false)
const currentRow = ref<OutboxView | null>(null)
const currentPayload = ref('')

function statusTagType(s: OutboxStatus): 'warning' | 'info' | 'success' | 'danger' {
  if (s === 'SENT') return 'success'
  if (s === 'FAILED') return 'danger'
  if (s === 'SENDING') return 'info'
  return 'warning'
}

function statusLabel(s: OutboxStatus): string {
  return { PENDING: '待投递', SENDING: '投递中', SENT: '已投递', FAILED: '已失败' }[s]
}

async function loadPage(): Promise<void> {
  loading.value = true
  try {
    const view = await outboxApi.page({
      status: status.value,
      eventType: eventType.value,
      aggregateId: aggregateId.value,
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
  eventType.value = ''
  aggregateId.value = ''
  page.value = 1
  void loadPage()
}

function handleSizeChange(): void {
  page.value = 1
  void loadPage()
}

function showPayload(row: OutboxView): void {
  currentRow.value = row
  currentPayload.value = row.payload
  payloadVisible.value = true
}

async function onRetry(row: OutboxView): Promise<void> {
  retryingId.value = row.id
  try {
    await outboxApi.retry(row.id)
    ElMessage.success('已重新投递')
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
.outbox-page__toolbar {
  background: var(--admin-bg);
  border: 1px solid var(--admin-border-light);
  border-radius: var(--admin-radius-lg);
  padding: var(--admin-space-3) var(--admin-space-4);
}

.outbox-page__filter {
  display: flex;
  flex-wrap: wrap;
  margin: 0;
}

.outbox-page__empty {
  padding: var(--admin-space-6);
  color: var(--admin-text-tertiary);
  font-size: 13px;
  text-align: center;
}

.outbox-page__payload {
  background: var(--admin-bg);
  border: 1px solid var(--admin-border-light);
  border-radius: var(--admin-radius);
  padding: var(--admin-space-3);
  max-height: 360px;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-all;
  font-size: 12px;
}

.outbox-page__meta {
  margin-top: var(--admin-space-2);
  color: var(--admin-text-tertiary);
  font-size: 12px;
}
</style>
