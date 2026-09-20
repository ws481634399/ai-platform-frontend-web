<template>
  <div class="knowledge-page">
    <el-card
      shadow="never"
      class="block-card"
    >
      <template #header>
        <div class="card-header">
          <span>知识库文档</span>
          <!-- 上传：自定义 http-request，禁止 action 直传 -->
          <el-upload
            :show-file-list="false"
            accept=".md,.txt"
            :http-request="doUpload"
          >
            <el-button
              v-permission="'ai:knowledge:upload'"
              type="primary"
              :loading="uploading"
              :disabled="uploading"
            >
              {{ uploading ? '上传中…' : '上传文档（.md/.txt ≤5MB）' }}
            </el-button>
          </el-upload>
        </div>
      </template>

      <el-table
        v-loading="loading"
        :data="documents"
        border
        stripe
        size="small"
      >
        <el-table-column
          prop="title"
          label="标题"
          min-width="200"
          show-overflow-tooltip
        />
        <el-table-column
          label="状态"
          width="110"
          align="center"
        >
          <template #default="{ row }">
            <el-tag
              :type="statusTagType((row as KnowledgeDocumentView).status)"
              size="small"
            >
              {{ statusLabel((row as KnowledgeDocumentView).status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="chunkCount"
          label="切片数"
          width="80"
          align="center"
        />
        <el-table-column
          prop="version"
          label="版本"
          width="70"
          align="center"
        />
        <el-table-column
          label="启用"
          width="80"
          align="center"
        >
          <template #default="{ row }">
            <el-switch
              v-permission="{ code: 'ai:knowledge:update', mode: 'disabled' }"
              :model-value="(row as KnowledgeDocumentView).enabled"
              :loading="switchingId === (row as KnowledgeDocumentView).documentId"
              data-testid="knowledge-enabled-switch"
              @change="(value: string | number | boolean) => toggleEnabled(row as KnowledgeDocumentView, Boolean(value))"
            />
          </template>
        </el-table-column>
        <el-table-column
          label="上传时间"
          width="170"
          align="center"
        >
          <template #default="{ row }">
            {{ (row as KnowledgeDocumentView).createdAt || '—' }}
          </template>
        </el-table-column>
        <el-table-column
          label="处理时间"
          width="170"
          align="center"
        >
          <template #default="{ row }">
            {{ (row as KnowledgeDocumentView).processedAt || '—' }}
          </template>
        </el-table-column>
        <el-table-column
          label="失败原因"
          min-width="180"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            <span
              v-if="(row as KnowledgeDocumentView).failReason"
              class="fail-text"
            >
              {{ (row as KnowledgeDocumentView).failReason }}
            </span>
            <span v-else>—</span>
          </template>
        </el-table-column>
        <el-table-column
          label="操作"
          width="170"
          align="center"
          fixed="right"
        >
          <template #default="{ row }">
            <el-button
              v-permission="'ai:knowledge:rebuild'"
              link
              type="primary"
              :loading="rebuildingId === (row as KnowledgeDocumentView).documentId"
              @click="rebuild(row as KnowledgeDocumentView)"
            >
              重建索引
            </el-button>
            <el-popconfirm
              title="确认删除该文档？切片与原始文件将一并删除"
              confirm-button-text="删除"
              cancel-button-text="取消"
              @confirm="remove(row as KnowledgeDocumentView)"
            >
              <template #reference>
                <el-button
                  v-permission="'ai:knowledge:delete'"
                  link
                  type="danger"
                  :loading="deletingId === (row as KnowledgeDocumentView).documentId"
                >
                  删除
                </el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
        <template #empty>
          暂无知识文档，点击右上角上传
        </template>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import type { AxiosError } from 'axios'
import { ElMessage } from 'element-plus'
import type { UploadRequestOptions } from 'element-plus'
import { knowledgeApi } from '@/api/knowledge'
import type {
  KnowledgeDocumentStatus,
  KnowledgeDocumentView,
} from '@/api/knowledge'
import { validateKnowledgeFile } from './knowledge-validate'

/** 提取 UnifyResult.message（ai-service 错误信封，403 兜底） */
function extractMessage(ex: unknown, fallback: string): string {
  const data = (ex as AxiosError<{ message?: string }>).response?.data
  if (data?.message) return data.message
  if ((ex as AxiosError).response?.status === 403) return '无权执行该操作（403）'
  return fallback
}

function statusTagType(status: KnowledgeDocumentStatus): 'info' | 'warning' | 'success' | 'danger' {
  if (status === 'COMPLETED') return 'success'
  if (status === 'FAILED') return 'danger'
  if (status === 'PROCESSING') return 'warning'
  return 'info'
}

function statusLabel(status: KnowledgeDocumentStatus): string {
  const labels: Record<KnowledgeDocumentStatus, string> = {
    PENDING: '待处理',
    PROCESSING: '处理中',
    COMPLETED: '已完成',
    FAILED: '失败',
  }
  return labels[status]
}

const loading = ref(false)
const documents = ref<KnowledgeDocumentView[]>([])
const uploading = ref(false)
const switchingId = ref<string | null>(null)
const deletingId = ref<string | null>(null)
const rebuildingId = ref<string | null>(null)

async function load(): Promise<void> {
  loading.value = true
  try {
    documents.value = await knowledgeApi.list()
  } catch (ex) {
    ElMessage.error(extractMessage(ex, '文档列表加载失败'))
  } finally {
    loading.value = false
  }
}

async function doUpload(options: UploadRequestOptions): Promise<void> {
  // file 类型已由 UploadRequestOptions 声明为 File，无需再引用浏览器全局名
  const file = options.file
  const validation = validateKnowledgeFile(file)
  if (!validation.ok) {
    if (validation.reason === 'empty') {
      ElMessage.warning('请选择文档文件')
    } else if (validation.reason === 'type') {
      ElMessage.warning('仅支持 .md/.txt 格式')
    } else {
      ElMessage.warning('文档大小不能超过 5MB')
    }
    return
  }

  uploading.value = true
  try {
    await knowledgeApi.upload(file)
    ElMessage.success('上传成功，后台正在解析建索引')
    await load()
  } catch (ex) {
    ElMessage.error(extractMessage(ex, '文档上传失败'))
  } finally {
    uploading.value = false
  }
}

async function toggleEnabled(row: KnowledgeDocumentView, enabled: boolean): Promise<void> {
  switchingId.value = row.documentId
  try {
    await knowledgeApi.setEnabled(row.documentId, enabled)
    documents.value = documents.value.map((d) =>
      d.documentId === row.documentId ? { ...d, enabled } : d,
    )
    ElMessage.success(enabled ? '已启用' : '已停用')
  } catch (ex) {
    ElMessage.error(extractMessage(ex, '启停操作失败'))
  } finally {
    switchingId.value = null
  }
}

async function remove(row: KnowledgeDocumentView): Promise<void> {
  deletingId.value = row.documentId
  try {
    await knowledgeApi.remove(row.documentId)
    ElMessage.success('文档已删除')
    await load()
  } catch (ex) {
    ElMessage.error(extractMessage(ex, '文档删除失败'))
  } finally {
    deletingId.value = null
  }
}

async function rebuild(row: KnowledgeDocumentView): Promise<void> {
  rebuildingId.value = row.documentId
  try {
    await knowledgeApi.rebuild(row.documentId)
    ElMessage.success('重建任务已提交')
    await load()
  } catch (ex) {
    ElMessage.error(extractMessage(ex, '重建任务提交失败'))
  } finally {
    rebuildingId.value = null
  }
}

// 处理为后台任务：存在未完成文档时每 3s 轮询列表，全部终态停止
let pollTimer: ReturnType<typeof globalThis.setInterval> | null = null
const POLL_INTERVAL_MS = 3000
const ACTIVE_STATUSES: KnowledgeDocumentStatus[] = ['PENDING', 'PROCESSING']

function hasActive(): boolean {
  return documents.value.some((d) => ACTIVE_STATUSES.includes(d.status))
}

function ensurePolling(): void {
  if (hasActive() && pollTimer === null) {
    pollTimer = globalThis.setInterval(() => {
      void (async () => {
        await load()
        if (!hasActive() && pollTimer !== null) {
          globalThis.clearInterval(pollTimer)
          pollTimer = null
        }
      })()
    }, POLL_INTERVAL_MS)
  }
}

onMounted(async () => {
  await load()
  ensurePolling()
})

onUnmounted(() => {
  if (pollTimer !== null) {
    globalThis.clearInterval(pollTimer)
    pollTimer = null
  }
})
</script>

<style scoped>
.knowledge-page {
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

.fail-text {
  color: var(--el-color-danger);
}
</style>
