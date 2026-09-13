<script setup lang="ts">
import type { AxiosError } from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import { onMounted, reactive, ref } from 'vue'

import { categoryApi } from '@/api/product/category'
import type { CategoryNode, CategoryPayload, CategoryStatus } from '@/api/product/category'
import type { ApiResponse } from '@/types'
import { usePermission } from '@/composables/usePermission'

const { has } = usePermission()

const MAX_LEVEL = 3

const tree = ref<CategoryNode[]>([])
const loading = ref(false)

// ── 新增/编辑弹窗 ────────────────────────────────────────────────
const dialogVisible = ref(false)
const dialogSubmitting = ref(false)
const formMode = ref<'create' | 'update'>('create')
const editingId = ref<number | null>(null)
const parentId = ref(0)
const formRef = ref()
const form = reactive({ name: '', sort: 0 })

const formRules = {
  name: [
    { required: true, message: '请输入分类名称', trigger: 'blur' },
    { min: 1, max: 32, message: '分类名称长度为 1~32 个字符', trigger: 'blur' },
  ],
  sort: [{ type: 'number' as const, message: '排序必须为数字', trigger: 'change' }],
}

async function loadTree() {
  loading.value = true
  try {
    tree.value = await categoryApi.tree()
  } catch (ex) {
    ElMessage.error(extractMessage(ex, '分类树加载失败'))
  } finally {
    loading.value = false
  }
}

function openCreateRoot() {
  openCreate(0)
}

function openCreateChild(row: CategoryNode) {
  openCreate(row.id)
}

function openCreate(parent: number) {
  formMode.value = 'create'
  editingId.value = null
  parentId.value = parent
  form.name = ''
  form.sort = 0
  dialogVisible.value = true
}

function openUpdate(row: CategoryNode) {
  formMode.value = 'update'
  editingId.value = row.id
  parentId.value = row.parentId
  form.name = row.name
  form.sort = row.sort
  dialogVisible.value = true
}

async function submitForm() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  const payload: CategoryPayload = {
    name: form.name.trim(),
    parentId: parentId.value,
    sort: form.sort,
  }
  dialogSubmitting.value = true
  try {
    if (formMode.value === 'create') {
      await categoryApi.create(payload)
      ElMessage.success('分类创建成功')
    } else if (editingId.value !== null) {
      await categoryApi.update(editingId.value, payload)
      ElMessage.success('分类更新成功')
    }
    dialogVisible.value = false
    await loadTree()
  } catch (ex) {
    ElMessage.error(extractMessage(ex, '保存失败'))
  } finally {
    dialogSubmitting.value = false
  }
}

async function toggleStatus(row: CategoryNode) {
  const next: CategoryStatus = row.status === 'ENABLED' ? 'DISABLED' : 'ENABLED'
  const actionText = next === 'DISABLED' ? '禁用' : '启用'
  try {
    await ElMessageBox.confirm(
      `确认${actionText}分类「${row.name}」？${next === 'DISABLED' ? '禁用后不可在其下新增子分类，且不影响其子分类当前状态。' : ''}`,
      `${actionText}确认`,
      { type: 'warning', confirmButtonText: actionText, cancelButtonText: '取消' },
    )
  } catch {
    return // 用户取消
  }
  try {
    await categoryApi.changeStatus(row.id, next)
    ElMessage.success(`已${actionText}`)
    await loadTree()
  } catch (ex) {
    ElMessage.error(extractMessage(ex, `${actionText}失败`))
  }
}

function rowClassName({ row }: { row: CategoryNode }) {
  return row.status === 'DISABLED' ? 'category-row--disabled' : ''
}

function extractMessage(ex: unknown, fallback: string): string {
  const data = (ex as AxiosError<ApiResponse>).response?.data
  return data?.message || fallback
}

onMounted(loadTree)
</script>

<template>
  <section class="category-view">
    <div class="category-view__toolbar">
      <h2>分类管理</h2>
      <el-button
        v-if="has('product:category:create')"
        type="primary"
        data-testid="category-create-root"
        @click="openCreateRoot"
      >
        新增根分类
      </el-button>
    </div>

    <el-table
      v-loading="loading"
      :data="tree"
      row-key="id"
      border
      default-expand-all
      :tree-props="{ children: 'children' }"
      :row-class-name="rowClassName"
      data-testid="category-table"
    >
      <el-table-column prop="name" label="分类名称" min-width="240" />
      <el-table-column prop="level" label="层级" width="90" align="center" />
      <el-table-column prop="sort" label="排序" width="90" align="center" />
      <el-table-column label="状态" width="110" align="center">
        <template #default="{ row }">
          <el-tag :type="row.status === 'ENABLED' ? 'success' : 'info'" size="small">
            {{ row.status === 'ENABLED' ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="260" align="center">
        <template #default="{ row }">
          <el-button
            v-if="
              has('product:category:create') && row.level < MAX_LEVEL && row.status === 'ENABLED'
            "
            link
            type="primary"
            :data-testid="`category-add-child-${row.id}`"
            @click="openCreateChild(row as CategoryNode)"
          >
            新增子级
          </el-button>
          <el-button
            v-if="has('product:category:update')"
            link
            type="primary"
            :data-testid="`category-edit-${row.id}`"
            @click="openUpdate(row as CategoryNode)"
          >
            编辑
          </el-button>
          <el-button
            v-if="has('product:category:disable')"
            link
            :type="row.status === 'ENABLED' ? 'danger' : 'success'"
            :data-testid="`category-toggle-${row.id}`"
            @click="toggleStatus(row as CategoryNode)"
          >
            {{ row.status === 'ENABLED' ? '禁用' : '启用' }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog
      v-model="dialogVisible"
      :title="formMode === 'create' ? (parentId === 0 ? '新增根分类' : '新增子分类') : '编辑分类'"
      width="420px"
      :close-on-click-modal="false"
      data-testid="category-dialog"
    >
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="72px" @submit.prevent>
        <el-form-item label="名称" prop="name">
          <el-input
            v-model="form.name"
            maxlength="32"
            show-word-limit
            placeholder="1~32 个字符"
            data-testid="category-form-name"
          />
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number
            v-model="form.sort"
            :min="0"
            :max="9999"
            data-testid="category-form-sort"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false"> 取消 </el-button>
        <el-button
          type="primary"
          :loading="dialogSubmitting"
          data-testid="category-form-submit"
          @click="submitForm"
        >
          确定
        </el-button>
      </template>
    </el-dialog>
  </section>
</template>

<style scoped>
.category-view__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.category-view__toolbar h2 {
  margin: 0;
}

/* 禁用分类整行置灰（含子级不受影响，仅视觉标识当前节点状态） */
:deep(.category-row--disabled) {
  color: var(--el-text-color-disabled);
}

:deep(.category-row--disabled td) {
  background-color: var(--el-fill-color-light);
}
</style>
