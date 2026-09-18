<template>
  <div class="log-page">
    <el-card shadow="never">
      <el-form
        :inline="true"
        @submit.prevent
      >
        <el-form-item label="SKU ID">
          <el-input
            v-model="filters.skuId"
            placeholder="按 SKU ID 过滤"
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

    <el-card shadow="never">
      <el-table
        v-loading="loading"
        :data="records"
        border
        stripe
      >
        <el-table-column
          prop="id"
          label="ID"
          width="190"
        />
        <el-table-column
          label="商品 / SKU"
          min-width="220"
        >
          <template #default="{ row }">
            <div class="sku-cell">
              <span
                class="sku-cell__name"
                :title="(row as InventoryLogItem).productName ?? ''"
              >{{ (row as InventoryLogItem).productName ?? '—' }}</span>
              <span class="sku-cell__sub">
                {{ (row as InventoryLogItem).skuCode ?? '—' }}
                <template v-if="specText((row as InventoryLogItem).specifications)">
                  · {{ specText((row as InventoryLogItem).specifications) }}
                </template>
              </span>
            </div>
          </template>
        </el-table-column>
        <el-table-column
          prop="skuId"
          label="SKU ID"
          width="200"
        />
        <el-table-column
          label="操作类型"
          width="110"
          align="center"
        >
          <template #default="{ row }">
            <el-tag :type="opTypeColor((row as InventoryLogItem).operationType)">
              {{ opTypeLabel((row as InventoryLogItem).operationType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="quantity"
          label="变动数量"
          width="110"
          align="right"
        >
          <template #default="{ row }">
            <span :class="{ 'delta-positive': (row as InventoryLogItem).quantity > 0, 'delta-negative': (row as InventoryLogItem).quantity < 0 }">
              {{ (row as InventoryLogItem).quantity > 0 ? '+' : '' }}{{ (row as InventoryLogItem).quantity }}
            </span>
          </template>
        </el-table-column>
        <el-table-column
          prop="beforeQuantity"
          label="变更前"
          width="100"
          align="right"
        />
        <el-table-column
          prop="afterQuantity"
          label="变更后"
          width="100"
          align="right"
        />
        <el-table-column
          prop="businessId"
          label="业务单号"
          min-width="160"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            {{ (row as InventoryLogItem).businessId || '—' }}
          </template>
        </el-table-column>
        <el-table-column
          prop="traceId"
          label="Trace ID"
          min-width="180"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            {{ (row as InventoryLogItem).traceId || '—' }}
          </template>
        </el-table-column>
        <el-table-column
          prop="occurredAt"
          label="发生时间"
          width="180"
        >
          <template #default="{ row }">
            {{ formatTime((row as InventoryLogItem).occurredAt) }}
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
import { inventoryApi } from '@/api/inventory/inventory'
import type { InventoryLogItem } from '@/api/inventory/inventory'

const loading = ref(false)
const records = ref<InventoryLogItem[]>([])
const total = ref(0)
const page = ref(1)
const size = ref(20)

const filters = reactive<{ skuId: string | undefined }>({
  skuId: undefined,
})

async function loadPage(): Promise<void> {
  loading.value = true
  try {
    const view = await inventoryApi.logs({
      // CHG-0015：雪花 ID 全程字符串，不做数值转换
      skuId: filters.skuId?.trim() || undefined,
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
  filters.skuId = undefined
  page.value = 1
  void loadPage()
}

function handleSizeChange(): void {
  page.value = 1
  void loadPage()
}

const opLabels: Record<string, string> = {
  INIT: '初始化',
  ADJUST: '调整',
  LOCK: '锁定',
  RELEASE: '释放',
  DEDUCT: '扣减',
}

function opTypeLabel(type: string): string {
  return opLabels[type] ?? type
}

function opTypeColor(type: string): 'success' | 'warning' | 'danger' | 'info' | 'primary' {
  switch (type) {
    case 'INIT':
      return 'primary'
    case 'ADJUST':
      return 'warning'
    case 'LOCK':
      return 'info'
    case 'RELEASE':
      return 'success'
    case 'DEDUCT':
      return 'danger'
    default:
      return 'info'
  }
}

function formatTime(iso: string): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('zh-CN', { hour12: false })
  } catch {
    return iso
  }
}

function specText(specs: Record<string, string> | null): string {
  if (!specs) return ''
  const entries = Object.entries(specs)
  if (entries.length === 0) return ''
  return entries.map(([k, v]) => `${k}:${v}`).join(' ')
}

onMounted(() => {
  void loadPage()
})
</script>

<style scoped>
.log-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.delta-positive {
  color: var(--el-color-success);
  font-weight: 600;
}

.delta-negative {
  color: var(--el-color-danger);
  font-weight: 600;
}

.sku-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.sku-cell__name {
  font-weight: 500;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sku-cell__sub {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
