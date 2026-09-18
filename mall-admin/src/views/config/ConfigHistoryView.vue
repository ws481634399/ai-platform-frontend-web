<template>
  <div class="config-history-page">
    <!-- 查询区 -->
    <el-card
      shadow="never"
      class="filter-card"
    >
      <el-form
        :inline="true"
        @submit.prevent
      >
        <el-form-item label="配置类型">
          <el-select
            v-model="filters.configType"
            placeholder="全部类型"
            clearable
            style="width: 150px"
          >
            <el-option
              label="功能开关"
              value="FEATURE"
            />
            <el-option
              label="系统参数"
              value="PARAMETER"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="Key">
          <el-input
            v-model="filters.key"
            placeholder="按配置 Key 筛选"
            clearable
            style="width: 220px"
            @keyup.enter="handleSearch"
            @clear="handleSearch"
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

    <!-- 列表 -->
    <el-card shadow="never">
      <el-table
        v-loading="loading"
        :data="records"
        border
        stripe
      >
        <el-table-column
          label="配置类型"
          width="100"
          align="center"
        >
          <template #default="{ row }">
            <el-tag
              :type="(row as ConfigHistoryItem).configType === 'FEATURE' ? 'primary' : 'success'"
              size="small"
            >
              {{ (row as ConfigHistoryItem).configType === 'FEATURE' ? '功能开关' : '系统参数' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="configKey"
          label="配置 Key"
          min-width="180"
          show-overflow-tooltip
        />
        <el-table-column
          label="变更类型"
          width="90"
          align="center"
        >
          <template #default="{ row }">
            <el-tag
              :type="kindTagType((row as ConfigHistoryItem).changeKind)"
              size="small"
            >
              {{ kindLabel((row as ConfigHistoryItem).changeKind) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          label="变更前"
          min-width="150"
          show-overflow-tooltip
          class-name="tabular"
        >
          <template #default="{ row }">
            {{ (row as ConfigHistoryItem).oldValue ?? '—' }}
          </template>
        </el-table-column>
        <el-table-column
          label="变更后"
          min-width="150"
          show-overflow-tooltip
          class-name="tabular"
        >
          <template #default="{ row }">
            {{ (row as ConfigHistoryItem).newValue ?? '—' }}
          </template>
        </el-table-column>
        <el-table-column
          prop="changedBy"
          label="操作人"
          width="130"
          show-overflow-tooltip
        />
        <el-table-column
          prop="changeReason"
          label="变更原因"
          min-width="160"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            {{ (row as ConfigHistoryItem).changeReason || '—' }}
          </template>
        </el-table-column>
        <el-table-column
          prop="traceId"
          label="TraceId"
          width="220"
          show-overflow-tooltip
          class-name="tabular"
        />
        <el-table-column
          label="变更时间"
          width="170"
          align="center"
          class-name="tabular"
        >
          <template #default="{ row }">
            {{ formatMillis((row as ConfigHistoryItem).changedAt) }}
          </template>
        </el-table-column>
        <template #empty>
          暂无配置变更历史
        </template>
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
// 权限码 system:config-history:list：页面数据加载由 bootstrap 菜单可见性保证，
// 若后端返回 403 则走 friendlyConfigErrorMessage 兜底提示。
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { configHistoryApi, friendlyConfigErrorMessage } from '@/api/config'
import type { ConfigChangeKind, ConfigHistoryItem, ConfigType } from '@/api/config'

function formatMillis(ms: number, placeholder = '—'): string {
  const date = new Date(ms)
  if (Number.isNaN(date.getTime())) return placeholder
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} `
    + `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

function kindLabel(kind: ConfigChangeKind): string {
  const labels: Record<ConfigChangeKind, string> = {
    CREATED: '新建',
    UPDATED: '更新',
    DELETED: '删除',
  }
  return labels[kind]
}

function kindTagType(kind: ConfigChangeKind): 'success' | 'warning' | 'danger' {
  if (kind === 'CREATED') return 'success'
  if (kind === 'DELETED') return 'danger'
  return 'warning'
}

const loading = ref(false)
const records = ref<ConfigHistoryItem[]>([])
const total = ref(0)
const page = ref(1)
const size = ref(20)

const filters = reactive<{ configType: ConfigType | ''; key: string }>({
  configType: '',
  key: '',
})

async function loadPage(): Promise<void> {
  loading.value = true
  try {
    const view = await configHistoryApi.page({
      configType: filters.configType,
      key: filters.key,
      page: page.value,
      size: size.value,
    })
    records.value = view.items
    total.value = view.total
  } catch (ex) {
    ElMessage.error(friendlyConfigErrorMessage(ex, '配置变更历史加载失败'))
  } finally {
    loading.value = false
  }
}

function handleSearch(): void {
  page.value = 1
  void loadPage()
}

function handleReset(): void {
  filters.configType = ''
  filters.key = ''
  page.value = 1
  void loadPage()
}

function handleSizeChange(): void {
  page.value = 1
  void loadPage()
}

onMounted(() => {
  void loadPage()
})
</script>

<style scoped>
.config-history-page {
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
