<template>
  <div class="feature-config-page">
    <!-- 查询区 -->
    <el-card
      shadow="never"
      class="filter-card"
    >
      <el-form
        :inline="true"
        @submit.prevent
      >
        <el-form-item label="分组">
          <el-input
            v-model="filters.group"
            placeholder="按分组筛选"
            clearable
            style="width: 180px"
            @keyup.enter="handleSearch"
            @clear="handleSearch"
          />
        </el-form-item>
        <el-form-item label="启用状态">
          <el-select
            v-model="filters.enabled"
            placeholder="全部"
            clearable
            style="width: 130px"
          >
            <el-option
              label="已启用"
              :value="true"
            />
            <el-option
              label="已禁用"
              :value="false"
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

    <!-- 列表 -->
    <el-card shadow="never">
      <div class="toolbar">
        <el-button
          v-permission="updatePermission"
          type="primary"
          :icon="Plus"
          @click="openCreate"
        >
          新建功能开关
        </el-button>
      </div>

      <el-table
        v-loading="loading"
        :data="records"
        border
        stripe
      >
        <el-table-column
          prop="key"
          label="Key"
          min-width="180"
          show-overflow-tooltip
        />
        <el-table-column
          prop="name"
          label="名称"
          min-width="140"
          show-overflow-tooltip
        />
        <el-table-column
          prop="group"
          label="分组"
          width="130"
          show-overflow-tooltip
        />
        <el-table-column
          label="启用"
          width="80"
          align="center"
        >
          <template #default="{ row }">
            <el-switch
              :model-value="(row as FeatureConfigItem).enabled"
              :disabled="!canUpdate"
              @change="toggleEnabled(row as FeatureConfigItem)"
            />
          </template>
        </el-table-column>
        <el-table-column
          label="公开"
          width="80"
          align="center"
        >
          <template #default="{ row }">
            <el-tag
              :type="(row as FeatureConfigItem).publicFlag ? 'success' : 'info'"
              size="small"
            >
              {{ (row as FeatureConfigItem).publicFlag ? '公开' : '内部' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          label="内置"
          width="80"
          align="center"
        >
          <template #default="{ row }">
            <el-tag
              v-if="(row as FeatureConfigItem).builtIn"
              type="warning"
              size="small"
            >
              内置
            </el-tag>
            <span v-else>—</span>
          </template>
        </el-table-column>
        <el-table-column
          prop="version"
          label="版本"
          width="80"
          align="center"
        />
        <el-table-column
          prop="description"
          label="描述"
          min-width="200"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            {{ (row as FeatureConfigItem).description || '—' }}
          </template>
        </el-table-column>
        <el-table-column
          label="操作"
          width="150"
          align="center"
          fixed="right"
        >
          <template #default="{ row }">
            <el-button
              v-permission="updatePermission"
              link
              type="primary"
              @click="openEdit(row as FeatureConfigItem)"
            >
              编辑
            </el-button>
            <!-- 内置配置不可删除：禁用按钮 + tooltip 说明（B0601） -->
            <el-tooltip
              v-if="(row as FeatureConfigItem).builtIn"
              content="内置配置不可删除"
              placement="top"
              :show-after="200"
            >
              <span class="disabled-action-wrap">
                <el-button
                  link
                  type="danger"
                  disabled
                >
                  删除
                </el-button>
              </span>
            </el-tooltip>
            <el-button
              v-else
              v-permission="updatePermission"
              link
              type="danger"
              @click="confirmRemove(row as FeatureConfigItem)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
        <template #empty>
          暂无功能开关
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

    <!-- 新建 / 编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="editingKey === null ? '新建功能开关' : '编辑功能开关'"
      width="560px"
      @closed="resetForm"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="96px"
        @submit.prevent
      >
        <el-form-item
          label="Key"
          prop="key"
        >
          <el-input
            v-model="form.key"
            maxlength="128"
            show-word-limit
            :disabled="editingKey !== null"
            placeholder="唯一标识，如 mall.search.fuzzy"
          />
        </el-form-item>
        <el-form-item
          label="名称"
          prop="name"
        >
          <el-input
            v-model="form.name"
            maxlength="64"
            show-word-limit
          />
        </el-form-item>
        <el-form-item
          label="分组"
          prop="group"
        >
          <el-input
            v-model="form.group"
            maxlength="64"
            placeholder="如：交易 / 搜索"
          />
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="form.enabled" />
        </el-form-item>
        <el-form-item label="对 C 端公开">
          <el-switch v-model="form.publicFlag" />
        </el-form-item>
        <el-form-item
          label="描述"
          prop="description"
        >
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            maxlength="255"
            show-word-limit
          />
        </el-form-item>
        <el-form-item
          v-if="editingKey !== null"
          label="变更原因"
          prop="changeReason"
        >
          <el-input
            v-model="form.changeReason"
            type="textarea"
            :rows="2"
            maxlength="200"
            show-word-limit
            placeholder="本次修改原因（审计留痕）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">
          取消
        </el-button>
        <el-button
          type="primary"
          :loading="submitting"
          @click="submitForm"
        >
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import {
  featureConfigApi,
  friendlyConfigErrorMessage,
} from '@/api/config'
import type { FeatureConfigItem } from '@/api/config'
import { usePermission } from '@/composables/usePermission'

/** 权限码：列表可见性由 bootstrap 菜单保证，写操作统一使用 update 码 */
const updatePermission = 'system:feature:update'
const { has } = usePermission()
const canUpdate = has(updatePermission)

const loading = ref(false)
const records = ref<FeatureConfigItem[]>([])
const total = ref(0)
const page = ref(1)
const size = ref(20)

const filters = reactive<{ group: string; enabled: boolean | '' }>({
  group: '',
  enabled: '',
})

async function loadPage(): Promise<void> {
  loading.value = true
  try {
    const view = await featureConfigApi.page({
      group: filters.group,
      enabled: filters.enabled,
      page: page.value,
      size: size.value,
    })
    records.value = view.items
    total.value = view.total
  } catch (ex) {
    ElMessage.error(friendlyConfigErrorMessage(ex, '功能开关加载失败'))
  } finally {
    loading.value = false
  }
}

function handleSearch(): void {
  page.value = 1
  void loadPage()
}

function handleReset(): void {
  filters.group = ''
  filters.enabled = ''
  page.value = 1
  void loadPage()
}

function handleSizeChange(): void {
  page.value = 1
  void loadPage()
}

// ── 新建 / 编辑 ────────────────────────────────────────────────

const dialogVisible = ref(false)
const submitting = ref(false)
const editingKey = ref<string | null>(null)
const editingVersion = ref(0)
const formRef = ref<FormInstance>()

const form = reactive({
  key: '',
  name: '',
  group: '',
  enabled: true,
  publicFlag: false,
  description: '',
  changeReason: '',
})

const rules: FormRules = {
  key: [
    { required: true, whitespace: true, message: 'Key 不能为空', trigger: 'blur' },
    { max: 128, message: 'Key 不超过 128 个字符', trigger: 'blur' },
  ],
  name: [
    { required: true, whitespace: true, message: '名称不能为空', trigger: 'blur' },
    { max: 64, message: '名称不超过 64 个字符', trigger: 'blur' },
  ],
  group: [{ max: 64, message: '分组不超过 64 个字符', trigger: 'blur' }],
  description: [{ max: 255, message: '描述不超过 255 个字符', trigger: 'blur' }],
  changeReason: [
    { required: true, whitespace: true, message: '变更原因不能为空', trigger: 'blur' },
    { max: 200, message: '变更原因不超过 200 个字符', trigger: 'blur' },
  ],
}

function openCreate(): void {
  editingKey.value = null
  dialogVisible.value = true
}

function openEdit(row: FeatureConfigItem): void {
  editingKey.value = row.key
  editingVersion.value = row.version
  form.key = row.key
  form.name = row.name
  form.group = row.group
  form.enabled = row.enabled
  form.publicFlag = row.publicFlag
  form.description = row.description
  form.changeReason = ''
  dialogVisible.value = true
}

async function submitForm(): Promise<void> {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  submitting.value = true
  try {
    if (editingKey.value === null) {
      await featureConfigApi.create({
        key: form.key.trim(),
        name: form.name.trim(),
        group: form.group.trim(),
        enabled: form.enabled,
        publicFlag: form.publicFlag,
        description: form.description.trim(),
      })
      ElMessage.success('功能开关创建成功')
    } else {
      // 乐观锁：携带行内 version，冲突时后端返回 B0604
      await featureConfigApi.update(editingKey.value, {
        name: form.name.trim(),
        group: form.group.trim(),
        enabled: form.enabled,
        publicFlag: form.publicFlag,
        description: form.description.trim(),
        version: editingVersion.value,
        changeReason: form.changeReason.trim(),
      })
      ElMessage.success('功能开关已更新')
    }
    dialogVisible.value = false
    await loadPage()
  } catch (ex) {
    // B0602 key 冲突 / B0604 版本冲突等：展示服务端文案，保留弹窗便于重试
    ElMessage.error(friendlyConfigErrorMessage(ex, '保存失败'))
  } finally {
    submitting.value = false
  }
}

function resetForm(): void {
  form.key = ''
  form.name = ''
  form.group = ''
  form.enabled = true
  form.publicFlag = false
  form.description = ''
  form.changeReason = ''
  formRef.value?.clearValidate()
}

// ── 行内开关 ───────────────────────────────────────────────────

async function toggleEnabled(row: FeatureConfigItem): Promise<void> {
  const next = !row.enabled
  let reason: string
  try {
    const result = await ElMessageBox.prompt(
      `确认${next ? '启用' : '禁用'}功能开关「${row.name}」？请填写变更原因。`,
      '变更确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputType: 'textarea',
        inputPlaceholder: '变更原因（审计留痕）',
        inputValidator: (value: string) => value.trim().length > 0 || '变更原因不能为空',
      },
    )
    reason = result.value
  } catch {
    return // 用户取消：switch 为 :model-value 单向绑定，视图自动回退
  }
  try {
    await featureConfigApi.update(row.key, {
      name: row.name,
      group: row.group,
      enabled: next,
      publicFlag: row.publicFlag,
      description: row.description,
      version: row.version,
      changeReason: reason.trim(),
    })
    ElMessage.success(next ? '已启用' : '已禁用')
    await loadPage()
  } catch (ex) {
    ElMessage.error(friendlyConfigErrorMessage(ex, '状态更新失败'))
  }
}

// ── 删除 ───────────────────────────────────────────────────────

async function confirmRemove(row: FeatureConfigItem): Promise<void> {
  let reason: string
  try {
    const result = await ElMessageBox.prompt(
      `确认删除功能开关「${row.name}」（${row.key}）？删除后不可恢复，请填写删除原因。`,
      '删除确认',
      {
        type: 'warning',
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        inputType: 'textarea',
        inputPlaceholder: '删除原因（审计留痕）',
        inputValidator: (value: string) => value.trim().length > 0 || '删除原因不能为空',
      },
    )
    reason = result.value
  } catch {
    return // 用户取消
  }
  try {
    await featureConfigApi.remove(row.key, reason.trim())
    ElMessage.success('功能开关已删除')
    await loadPage()
  } catch (ex) {
    // B0601（内置不可删 / 值非法）、B0603（不存在）均以服务端文案为准
    ElMessage.error(friendlyConfigErrorMessage(ex, '删除失败'))
  }
}

onMounted(() => {
  void loadPage()
})
</script>

<style scoped>
.feature-config-page {
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

/* 禁用按钮被 tooltip 包裹时需让 span 承接 hover 区域 */
.disabled-action-wrap {
  display: inline-block;
  cursor: not-allowed;
}
</style>
