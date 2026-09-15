<template>
  <div class="inventory-page">
    <el-card
      class="filter-card"
      shadow="never"
    >
      <el-form
        :inline="true"
        @submit.prevent
      >
        <el-form-item label="SKU ID">
          <el-input
            v-model="filters.skuId"
            placeholder="按 SKU ID 查询"
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
      <div class="toolbar">
        <el-button
          v-if="has('inventory:stock:init')"
          type="primary"
          :icon="Plus"
          @click="openInit"
        >
          初始化库存
        </el-button>
      </div>

      <el-table
        v-loading="loading"
        :data="records"
        border
        stripe
      >
        <el-table-column
          prop="skuId"
          label="SKU ID"
          width="200"
        />
        <el-table-column
          prop="totalQuantity"
          label="总库存"
          width="120"
          align="right"
        />
        <el-table-column
          prop="lockedQuantity"
          label="锁定库存"
          width="120"
          align="right"
        />
        <el-table-column
          label="可用库存"
          width="120"
          align="right"
        >
          <template #default="{ row }">
            <el-tag :type="(row as InventoryItem).availableQuantity > 0 ? 'success' : 'danger'">
              {{ (row as InventoryItem).availableQuantity }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          label="操作"
          width="120"
          align="center"
          fixed="right"
        >
          <template #default="{ row }">
            <el-button
              v-if="has('inventory:stock:adjust')"
              link
              type="primary"
              @click="openAdjust(row as InventoryItem)"
            >
              调整
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

    <el-dialog
      v-model="initVisible"
      title="初始化库存"
      width="440px"
      @closed="resetInitForm"
    >
      <el-form
        ref="initFormRef"
        :model="initForm"
        :rules="initRules"
        label-width="100px"
        @submit.prevent
      >
        <el-form-item
          label="SKU ID"
          prop="skuId"
        >
          <el-input
            v-model="initForm.skuId"
            placeholder="粘贴 19 位雪花 SKU ID"
            maxlength="19"
          />
        </el-form-item>
        <el-form-item
          label="总库存"
          prop="totalQuantity"
        >
          <el-input-number
            v-model="initForm.totalQuantity"
            :min="0"
            :max="9223372036854775807"
            controls-position="right"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="initVisible = false">
          取消
        </el-button>
        <el-button
          type="primary"
          :loading="submitting"
          @click="submitInit"
        >
          确定
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="adjustVisible"
      title="调整库存"
      width="480px"
      @closed="resetAdjustForm"
    >
      <el-form
        ref="adjustFormRef"
        :model="adjustForm"
        :rules="adjustRules"
        label-width="100px"
        @submit.prevent
      >
        <el-form-item label="SKU ID">
          <el-input
            :model-value="adjustForm.skuId"
            disabled
          />
        </el-form-item>
        <el-form-item
          label="调整数量"
          prop="delta"
        >
          <el-input-number
            v-model="adjustForm.delta"
            controls-position="right"
            style="width: 100%"
          />
          <div class="form-tip">正数为入库，负数为出库</div>
        </el-form-item>
        <el-form-item
          label="调整原因"
          prop="reason"
        >
          <el-input
            v-model="adjustForm.reason"
            maxlength="128"
            show-word-limit
            placeholder="如：盘点差异、损坏报损"
          />
        </el-form-item>
        <el-form-item
          label="业务单号"
          prop="businessId"
        >
          <el-input
            v-model="adjustForm.businessId"
            maxlength="64"
            placeholder="可选，关联业务单号"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="adjustVisible = false">
          取消
        </el-button>
        <el-button
          type="primary"
          :loading="submitting"
          @click="submitAdjust"
        >
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { inventoryApi } from '@/api/inventory/inventory'
import type { InventoryItem } from '@/api/inventory/inventory'
import { usePermission } from '@/composables/usePermission'

const { has } = usePermission()

const loading = ref(false)
const records = ref<InventoryItem[]>([])
const total = ref(0)
const page = ref(1)
const size = ref(20)

const filters = reactive<{ skuId: string | undefined }>({
  skuId: undefined,
})

async function loadPage(): Promise<void> {
  loading.value = true
  try {
    const view = await inventoryApi.page({
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

// ---------- 初始化 ----------

const initVisible = ref(false)
const initFormRef = ref<FormInstance>()
const initForm = reactive<{ skuId: string; totalQuantity: number }>({ skuId: '', totalQuantity: 0 })
const initRules: FormRules = {
  skuId: [
    { required: true, message: '请输入 SKU ID', trigger: 'blur' },
    { pattern: /^\d{1,19}$/, message: 'SKU ID 为纯数字（最长 19 位）', trigger: 'blur' },
  ],
  totalQuantity: [{ required: true, type: 'number', min: 0, message: '总库存不能为负', trigger: 'blur' }],
}

function openInit(): void {
  initVisible.value = true
}

async function submitInit(): Promise<void> {
  if (!initFormRef.value) return
  const valid = await initFormRef.value.validate().catch(() => false)
  if (!valid) return
  submitting.value = true
  try {
    await inventoryApi.init({ skuId: initForm.skuId.trim(), totalQuantity: initForm.totalQuantity })
    ElMessage.success('库存初始化成功')
    initVisible.value = false
    await loadPage()
  } catch {
    // 服务端错误由拦截器提示
  } finally {
    submitting.value = false
  }
}

function resetInitForm(): void {
  initForm.skuId = ''
  initForm.totalQuantity = 0
  initFormRef.value?.clearValidate()
}

// ---------- 调整 ----------

const adjustVisible = ref(false)
const submitting = ref(false)
const adjustFormRef = ref<FormInstance>()
const adjustForm = reactive<{ skuId: string; delta: number; reason: string; businessId: string }>({
  skuId: '',
  delta: 0,
  reason: '',
  businessId: '',
})
const adjustRules: FormRules = {
  delta: [{ required: true, type: 'number', message: '请输入调整数量', trigger: 'blur' }],
  reason: [{ max: 128, message: '原因不超过 128 个字符', trigger: 'blur' }],
  businessId: [{ max: 64, message: '业务单号不超过 64 个字符', trigger: 'blur' }],
}

function openAdjust(row: InventoryItem): void {
  adjustForm.skuId = row.skuId
  adjustForm.delta = 0
  adjustForm.reason = ''
  adjustForm.businessId = ''
  adjustVisible.value = true
}

async function submitAdjust(): Promise<void> {
  if (!adjustFormRef.value) return
  const valid = await adjustFormRef.value.validate().catch(() => false)
  if (!valid) return
  submitting.value = true
  try {
    await inventoryApi.adjust(adjustForm.skuId, {
      delta: adjustForm.delta,
      reason: adjustForm.reason.trim() || undefined,
      businessId: adjustForm.businessId.trim() || undefined,
    })
    ElMessage.success('库存调整成功')
    adjustVisible.value = false
    await loadPage()
  } catch {
    // 服务端错误由拦截器提示
  } finally {
    submitting.value = false
  }
}

function resetAdjustForm(): void {
  adjustForm.skuId = ''
  adjustForm.delta = 0
  adjustForm.reason = ''
  adjustForm.businessId = ''
  adjustFormRef.value?.clearValidate()
}

onMounted(() => {
  void loadPage()
})
</script>

<style scoped>
.inventory-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.toolbar {
  margin-bottom: 12px;
}

.pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.form-tip {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}
</style>
