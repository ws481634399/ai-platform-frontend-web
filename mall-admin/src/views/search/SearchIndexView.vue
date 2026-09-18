<template>
  <div class="search-index-page">
    <!-- ① 重建操作 -->
    <el-card
      shadow="never"
      class="block-card"
    >
      <template #header>
        <div class="card-header">
          <span>索引重建</span>
          <el-button
            v-permission="'search:index:rebuild'"
            type="primary"
            :icon="Refresh"
            :loading="triggering"
            @click="triggerRebuild"
          >
            触发全量重建
          </el-button>
        </div>
      </template>

      <!-- 当前/最近一次跟踪中的任务进度 -->
      <div
        v-if="activeTask"
        class="active-task"
      >
        <div class="active-task__head">
          <el-tag
            :type="rebuildTagType(activeTask.status)"
            size="small"
          >
            {{ rebuildStatusLabel(activeTask.status) }}
          </el-tag>
          <span class="active-task__no">任务号：{{ activeTask.taskNo }}</span>
          <span
            v-if="activeTask.physicalIndex"
            class="active-task__index"
          >物理索引：{{ activeTask.physicalIndex }}</span>
        </div>
        <el-progress
          :percentage="progressPercent"
          :status="activeTask.status === 'FAILED' ? 'exception' : activeTask.status === 'SUCCEEDED' ? 'success' : undefined"
        />
        <div class="active-task__meta">
          已索引 {{ activeTask.indexedCount }} / {{ activeTask.totalCount }} 条
          <span class="active-task__failed">
            ，失败 {{ activeTask.failedCount }} 条
          </span>
          <template v-if="activeTask.status === 'RUNNING'">
            ，每 2 秒自动刷新进度
          </template>
        </div>
        <div
          v-if="activeTask.errorMessage"
          class="active-task__error"
        >
          失败原因：{{ activeTask.errorMessage }}
        </div>
      </div>

      <el-table
        v-loading="recentLoading"
        :data="recentTasks"
        border
        stripe
        size="small"
      >
        <el-table-column
          prop="taskNo"
          label="任务号"
          min-width="180"
          show-overflow-tooltip
        />
        <el-table-column
          label="状态"
          width="100"
          align="center"
        >
          <template #default="{ row }">
            <el-tag
              :type="rebuildTagType((row as RebuildTaskView).status)"
              size="small"
            >
              {{ rebuildStatusLabel((row as RebuildTaskView).status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          label="进度"
          width="140"
          align="center"
          class-name="tabular"
        >
          <template #default="{ row }">
            {{ (row as RebuildTaskView).indexedCount }}/{{ (row as RebuildTaskView).totalCount }}
          </template>
        </el-table-column>
        <el-table-column
          prop="failedCount"
          label="失败数"
          width="80"
          align="center"
        />
        <el-table-column
          prop="physicalIndex"
          label="物理索引"
          min-width="140"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            {{ (row as RebuildTaskView).physicalIndex || '—' }}
          </template>
        </el-table-column>
        <el-table-column
          label="开始时间"
          width="160"
          align="center"
          class-name="tabular"
        >
          <template #default="{ row }">
            {{ formatMillis((row as RebuildTaskView).startedAt) }}
          </template>
        </el-table-column>
        <el-table-column
          label="结束时间"
          width="160"
          align="center"
          class-name="tabular"
        >
          <template #default="{ row }">
            {{ formatMillis((row as RebuildTaskView).finishedAt) }}
          </template>
        </el-table-column>
        <el-table-column
          prop="errorMessage"
          label="错误信息"
          min-width="180"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            {{ (row as RebuildTaskView).errorMessage || '—' }}
          </template>
        </el-table-column>
        <template #empty>
          暂无重建任务
        </template>
      </el-table>
    </el-card>

    <!-- ② 一致性检查 -->
    <el-card
      shadow="never"
      class="block-card"
    >
      <template #header>
        <div class="card-header">
          <span>索引一致性检查</span>
          <el-button
            v-permission="'search:index:list'"
            :icon="Aim"
            :loading="checking"
            @click="runConsistencyCheck"
          >
            执行检查
          </el-button>
        </div>
      </template>

      <div
        v-if="!consistency"
        class="hint-text"
      >
        点击「执行检查」比对在售商品与索引文档的差异。
      </div>
      <template v-else>
        <el-descriptions
          :column="3"
          border
          size="small"
        >
          <el-descriptions-item label="在售商品数">
            {{ consistency.productOnSaleCount }}
          </el-descriptions-item>
          <el-descriptions-item label="索引文档数">
            {{ consistency.indexCount }}
          </el-descriptions-item>
          <el-descriptions-item label="检查时间">
            {{ formatMillis(consistency.checkedAt) }}
          </el-descriptions-item>
          <el-descriptions-item label="索引缺失的商品 ID">
            <template v-if="consistency.missingProductIds.length">
              <span
                v-for="id in consistency.missingProductIds"
                :key="`missing-${id}`"
                class="id-chip"
              >{{ id }}</span>
              <span
                v-if="consistency.missingTruncated"
                class="hint-text"
              >（结果过多，仅展示部分 ID）</span>
            </template>
            <span
              v-else
              class="hint-text"
            >无缺失</span>
          </el-descriptions-item>
          <el-descriptions-item label="多余的索引文档商品 ID">
            <template v-if="consistency.extraProductIds.length">
              <span
                v-for="id in consistency.extraProductIds"
                :key="`extra-${id}`"
                class="id-chip"
              >{{ id }}</span>
              <span
                v-if="consistency.extraTruncated"
                class="hint-text"
              >（结果过多，仅展示部分 ID）</span>
            </template>
            <span
              v-else
              class="hint-text"
            >无多余</span>
          </el-descriptions-item>
        </el-descriptions>
      </template>
    </el-card>

    <!-- ③ 同步失败记录 -->
    <el-card
      shadow="never"
      class="block-card"
    >
      <template #header>
        <div class="card-header">
          <span>商品变更同步失败记录</span>
          <el-form
            :inline="true"
            @submit.prevent
          >
            <el-form-item label="状态">
              <el-select
                v-model="failureStatus"
                placeholder="全部状态"
                clearable
                style="width: 150px"
                @change="handleFailureSearch"
              >
                <el-option
                  label="待处理"
                  value="PENDING"
                />
                <el-option
                  label="重试中"
                  value="RETRYING"
                />
                <el-option
                  label="已成功"
                  value="SUCCEEDED"
                />
                <el-option
                  label="已失败（人工介入）"
                  value="DEAD"
                />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button
                type="primary"
                @click="handleFailureSearch"
              >
                查询
              </el-button>
              <el-button @click="handleFailureReset">
                重置
              </el-button>
            </el-form-item>
          </el-form>
        </div>
      </template>

      <el-table
        v-loading="failuresLoading"
        :data="failures"
        border
        stripe
        size="small"
      >
        <el-table-column
          prop="id"
          label="ID"
          width="90"
          align="center"
        />
        <el-table-column
          prop="productId"
          label="商品 ID"
          width="110"
          align="center"
          class-name="tabular"
        />
        <el-table-column
          prop="eventType"
          label="事件类型"
          min-width="130"
          show-overflow-tooltip
        />
        <el-table-column
          label="状态"
          width="150"
          align="center"
        >
          <template #default="{ row }">
            <el-tag
              :type="failureTagType((row as SyncFailureView).status)"
              size="small"
            >
              {{ failureStatusLabel((row as SyncFailureView).status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          label="重试次数"
          width="100"
          align="center"
          class-name="tabular"
        >
          <template #default="{ row }">
            {{ (row as SyncFailureView).retryCount }}/{{ (row as SyncFailureView).maxRetries }}
          </template>
        </el-table-column>
        <el-table-column
          prop="lastError"
          label="最近错误"
          min-width="200"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            {{ (row as SyncFailureView).lastError || '—' }}
          </template>
        </el-table-column>
        <el-table-column
          label="下次重试"
          width="160"
          align="center"
          class-name="tabular"
        >
          <template #default="{ row }">
            {{ formatMillis((row as SyncFailureView).nextRetryAt) }}
          </template>
        </el-table-column>
        <el-table-column
          label="创建时间"
          width="160"
          align="center"
          class-name="tabular"
        >
          <template #default="{ row }">
            {{ formatMillis((row as SyncFailureView).createdAt) }}
          </template>
        </el-table-column>
        <el-table-column
          label="操作"
          width="110"
          align="center"
          fixed="right"
        >
          <template #default="{ row }">
            <el-button
              v-if="canManualRetry((row as SyncFailureView).status)"
              v-permission="'search:index:rebuild'"
              link
              type="primary"
              :loading="retryingId === (row as SyncFailureView).id"
              @click="retryFailure(row as SyncFailureView)"
            >
              人工重试
            </el-button>
            <span v-else>—</span>
          </template>
        </el-table-column>
        <template #empty>
          暂无同步失败记录
        </template>
      </el-table>

      <div class="pager">
        <el-pagination
          v-model:current-page="failurePage"
          v-model:page-size="failureSize"
          :total="failureTotal"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @current-change="loadFailures"
          @size-change="handleFailureSizeChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import type { AxiosError } from 'axios'
import { ElMessage } from 'element-plus'
import { Aim, Refresh } from '@element-plus/icons-vue'
import { searchIndexApi } from '@/api/search'
import type {
  ConsistencyCheckView,
  RebuildStatus,
  RebuildTaskView,
  SyncFailureStatus,
  SyncFailureView,
} from '@/api/search'
import type { ApiResponse } from '@/types'

/** epoch millis 时间格式化（项目无通用日期工具，按本地时区展示） */
function formatMillis(ms: number | null | undefined, placeholder = '—'): string {
  if (ms === null || ms === undefined) return placeholder
  const date = new Date(ms)
  if (Number.isNaN(date.getTime())) return placeholder
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} `
    + `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

/** 提取 UnifyResult.message（对齐 CategoryTreeView 的既有错误提示范式，403 兜底） */
function extractMessage(ex: unknown, fallback: string): string {
  const data = (ex as AxiosError<ApiResponse>).response?.data
  if (data?.message) return data.message
  if ((ex as AxiosError).response?.status === 403) return '无权执行该操作（403）'
  return fallback
}

function rebuildTagType(status: RebuildStatus): 'primary' | 'success' | 'danger' {
  if (status === 'SUCCEEDED') return 'success'
  if (status === 'FAILED') return 'danger'
  return 'primary'
}

function rebuildStatusLabel(status: RebuildStatus): string {
  const labels: Record<RebuildStatus, string> = {
    RUNNING: '重建中',
    SUCCEEDED: '已成功',
    FAILED: '已失败',
  }
  return labels[status]
}

function failureTagType(status: SyncFailureStatus): 'warning' | 'primary' | 'success' | 'info' {
  if (status === 'SUCCEEDED') return 'success'
  if (status === 'DEAD') return 'info'
  if (status === 'RETRYING') return 'primary'
  return 'warning'
}

function failureStatusLabel(status: SyncFailureStatus): string {
  const labels: Record<SyncFailureStatus, string> = {
    PENDING: '待处理',
    RETRYING: '重试中',
    SUCCEEDED: '已成功',
    DEAD: '已失败（人工介入）',
  }
  return labels[status]
}

/** 仅 PENDING / DEAD 允许人工重试 */
function canManualRetry(status: SyncFailureStatus): boolean {
  return status === 'PENDING' || status === 'DEAD'
}

// ── ① 重建任务 ─────────────────────────────────────────────────
const triggering = ref(false)
const recentLoading = ref(false)
const recentTasks = ref<RebuildTaskView[]>([])
const activeTask = ref<RebuildTaskView | null>(null)

const progressPercent = computed(() => {
  const task = activeTask.value
  if (!task || task.totalCount <= 0) return task?.status === 'SUCCEEDED' ? 100 : 0
  return Math.min(100, Math.floor((task.indexedCount / task.totalCount) * 100))
})

// 经 globalThis 访问计时器，规避 eslint no-undef（未配置 browser globals）
let pollTimer: ReturnType<typeof globalThis.setInterval> | null = null
const POLL_INTERVAL_MS = 2000

function stopPolling(): void {
  if (pollTimer !== null) {
    globalThis.clearInterval(pollTimer)
    pollTimer = null
  }
}

/** 每 2s 轮询任务直到结束态；轮询异常不崩页，仅提示并停止 */
function startPolling(id: number): void {
  stopPolling()
  pollTimer = globalThis.setInterval(() => {
    void (async () => {
      try {
        const task = await searchIndexApi.getTask(id)
        activeTask.value = task
        if (task.status === 'RUNNING') return
        stopPolling()
        if (task.status === 'SUCCEEDED') {
          ElMessage.success('索引重建已完成')
        } else {
          ElMessage.error(task.errorMessage || '索引重建失败')
        }
        await loadRecent(false)
      } catch (ex) {
        stopPolling()
        ElMessage.error(extractMessage(ex, '重建状态轮询失败'))
        await loadRecent(false)
      }
    })()
  }, POLL_INTERVAL_MS)
}

async function loadRecent(trackRunning: boolean): Promise<void> {
  recentLoading.value = true
  try {
    recentTasks.value = await searchIndexApi.recentTasks(20)
    if (trackRunning) {
      const running = recentTasks.value.find((task) => task.status === 'RUNNING')
      if (running) {
        activeTask.value = running
        startPolling(running.id)
      }
    }
  } catch (ex) {
    ElMessage.error(extractMessage(ex, '最近重建任务加载失败'))
  } finally {
    recentLoading.value = false
  }
}

async function triggerRebuild(): Promise<void> {
  triggering.value = true
  try {
    const task = await searchIndexApi.rebuild()
    activeTask.value = task
    ElMessage.success('重建任务已提交')
    startPolling(task.id)
    await loadRecent(false)
  } catch (ex) {
    // B0503：已有 RUNNING 任务时后端 409，展示服务端消息；若列表中存在运行中任务则接续轮询
    ElMessage.error(extractMessage(ex, '重建任务触发失败'))
    await loadRecent(true)
  } finally {
    triggering.value = false
  }
}

// ── ② 一致性检查 ───────────────────────────────────────────────
const checking = ref(false)
const consistency = ref<ConsistencyCheckView | null>(null)

async function runConsistencyCheck(): Promise<void> {
  checking.value = true
  try {
    consistency.value = await searchIndexApi.consistencyCheck()
  } catch (ex) {
    ElMessage.error(extractMessage(ex, '一致性检查执行失败'))
  } finally {
    checking.value = false
  }
}

// ── ③ 同步失败记录 ─────────────────────────────────────────────
const failuresLoading = ref(false)
const failures = ref<SyncFailureView[]>([])
const failureTotal = ref(0)
const failurePage = ref(1)
const failureSize = ref(20)
const failureStatus = ref<SyncFailureStatus | ''>('')
const retryingId = ref<number | null>(null)

async function loadFailures(): Promise<void> {
  failuresLoading.value = true
  try {
    const view = await searchIndexApi.syncFailures({
      status: failureStatus.value,
      page: failurePage.value,
      size: failureSize.value,
    })
    failures.value = view.items
    failureTotal.value = view.total
  } catch (ex) {
    ElMessage.error(extractMessage(ex, '同步失败记录加载失败'))
  } finally {
    failuresLoading.value = false
  }
}

function handleFailureSearch(): void {
  failurePage.value = 1
  void loadFailures()
}

function handleFailureReset(): void {
  failureStatus.value = ''
  failurePage.value = 1
  void loadFailures()
}

function handleFailureSizeChange(): void {
  failurePage.value = 1
  void loadFailures()
}

async function retryFailure(row: SyncFailureView): Promise<void> {
  retryingId.value = row.id
  try {
    await searchIndexApi.retrySyncFailure(row.id)
    ElMessage.success('人工重试指令已执行')
    await loadFailures()
  } catch (ex) {
    ElMessage.error(extractMessage(ex, '人工重试失败'))
  } finally {
    retryingId.value = null
  }
}

onMounted(async () => {
  // 进入页面自动接续可能仍在运行的重建任务（刷新页面场景）
  await loadRecent(true)
  await loadFailures()
})

onUnmounted(stopPolling)
</script>

<style scoped>
.search-index-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
}

.active-task {
  margin-bottom: 16px;
  padding: 12px 16px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
  background: var(--el-fill-color-lighter);
}

.active-task__head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.active-task__no,
.active-task__index {
  font-size: 13px;
  color: var(--el-text-color-regular);
}

.active-task__meta {
  margin-top: 8px;
  font-size: 13px;
  color: var(--el-text-color-regular);
}

.active-task__failed {
  color: var(--el-color-danger);
}

.active-task__error {
  margin-top: 6px;
  font-size: 13px;
  color: var(--el-color-danger);
}

.hint-text {
  color: var(--el-text-color-placeholder);
  font-size: 13px;
}

.id-chip {
  display: inline-block;
  margin: 2px 4px 2px 0;
  padding: 1px 8px;
  border: 1px solid var(--el-border-color);
  border-radius: 3px;
  background: var(--el-fill-color-light);
  font-size: 12px;
  line-height: 20px;
}

.pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
