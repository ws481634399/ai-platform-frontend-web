<template>
  <div class="system-parameter-page">
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
          新建系统参数
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
          min-width="170"
          show-overflow-tooltip
        />
        <el-table-column
          prop="name"
          label="名称"
          min-width="130"
          show-overflow-tooltip
        />
        <el-table-column
          prop="group"
          label="分组"
          width="120"
          show-overflow-tooltip
        />
        <el-table-column
          label="类型"
          width="100"
          align="center"
        >
          <template #default="{ row }">
            <el-tag
              size="small"
            >
              {{ typeLabel((row as SystemParameterItem).type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="value"
          label="当前值"
          min-width="150"
          show-overflow-tooltip
          class-name="tabular"
        />
        <el-table-column
          label="默认值"
          min-width="120"
          show-overflow-tooltip
          class-name="tabular"
        >
          <template #default="{ row }">
            {{ (row as SystemParameterItem).defaultValue ?? '—' }}
          </template>
        </el-table-column>
        <el-table-column
          label="取值范围"
          min-width="140"
          align="center"
          class-name="tabular"
        >
          <template #default="{ row }">
            <template v-if="isNumericType((row as SystemParameterItem).type)">
              {{ (row as SystemParameterItem).minValue ?? '−∞' }} ~ {{ (row as SystemParameterItem).maxValue ?? '+∞' }}
            </template>
            <span v-else>—</span>
          </template>
        </el-table-column>
        <el-table-column
          label="生效方式"
          width="110"
          align="center"
        >
          <template #default="{ row }">
            <el-tag
              :type="(row as SystemParameterItem).effectType === 'RESTART_REQUIRED' ? 'danger' : 'success'"
              size="small"
            >
              {{ (row as SystemParameterItem).effectType === 'RESTART_REQUIRED' ? '重启生效' : '动态生效' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          label="公开"
          width="70"
          align="center"
        >
          <template #default="{ row }">
            <el-tag
              :type="(row as SystemParameterItem).publicFlag ? 'success' : 'info'"
              size="small"
            >
              {{ (row as SystemParameterItem).publicFlag ? '公开' : '内部' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          label="内置"
          width="70"
          align="center"
        >
          <template #default="{ row }">
            <el-tag
              v-if="(row as SystemParameterItem).builtIn"
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
          width="70"
          align="center"
        />
        <el-table-column
          prop="description"
          label="描述"
          min-width="180"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            {{ (row as SystemParameterItem).description || '—' }}
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
              @click="openEdit(row as SystemParameterItem)"
            >
              编辑
            </el-button>
            <el-tooltip
              v-if="(row as SystemParameterItem).builtIn"
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
              @click="confirmRemove(row as SystemParameterItem)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
        <template #empty>
          暂无系统参数
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
      :title="editingKey === null ? '新建系统参数' : '编辑系统参数'"
      width="600px"
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
            placeholder="唯一标识，如 mall.order.timeout-minutes"
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
          />
        </el-form-item>
        <el-form-item
          label="类型"
          prop="type"
        >
          <el-select
            v-model="form.type"
            style="width: 180px"
            :disabled="editingKey !== null"
            @change="handleTypeChange"
          >
            <el-option
              v-for="option in TYPE_OPTIONS"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
          <span
            v-if="isNumericType(form.type)"
            class="form-hint"
          >数值类型，可配置最小/最大范围</span>
        </el-form-item>

        <!-- 参数值：按 type 切换录入控件 -->
        <el-form-item
          label="参数值"
          prop="value"
        >
          <el-switch
            v-if="form.type === 'BOOLEAN'"
            v-model="boolValue"
            active-text="true"
            inactive-text="false"
          />
          <el-input-number
            v-else-if="isNumericType(form.type)"
            v-model="numValue"
            :precision="form.type === 'DECIMAL' ? undefined : 0"
            :step="form.type === 'DECIMAL' ? 0.01 : 1"
            controls-position="right"
          />
          <el-input
            v-else-if="form.type === 'JSON'"
            v-model="form.value"
            type="textarea"
            :rows="4"
            placeholder="合法 JSON，如 { fuzzy: true }"
          />
          <el-input
            v-else
            v-model="form.value"
            placeholder="字符串值"
          />
        </el-form-item>

        <el-form-item
          label="默认值"
          prop="defaultValue"
        >
          <el-switch
            v-if="form.type === 'BOOLEAN'"
            v-model="boolDefault"
            active-text="true"
            inactive-text="false"
          />
          <el-input-number
            v-else-if="isNumericType(form.type)"
            v-model="numDefault"
            :precision="form.type === 'DECIMAL' ? undefined : 0"
            :step="form.type === 'DECIMAL' ? 0.01 : 1"
            controls-position="right"
          />
          <el-input
            v-else
            v-model="form.defaultValue"
            :type="form.type === 'JSON' ? 'textarea' : 'text'"
            :rows="form.type === 'JSON' ? 3 : undefined"
            placeholder="可留空"
          />
        </el-form-item>

        <!-- 最小/最大值：仅数值类型展示 -->
        <template v-if="isNumericType(form.type)">
          <el-form-item
            label="最小值"
            prop="minValue"
          >
            <el-input-number
              v-model="numMin"
              :precision="form.type === 'DECIMAL' ? undefined : 0"
              :step="form.type === 'DECIMAL' ? 0.01 : 1"
              controls-position="right"
            />
          </el-form-item>
          <el-form-item
            label="最大值"
            prop="maxValue"
          >
            <el-input-number
              v-model="numMax"
              :precision="form.type === 'DECIMAL' ? undefined : 0"
              :step="form.type === 'DECIMAL' ? 0.01 : 1"
              controls-position="right"
            />
          </el-form-item>
        </template>

        <el-form-item label="生效方式">
          <el-radio-group v-model="form.effectType">
            <el-radio value="DYNAMIC">
              动态生效
            </el-radio>
            <el-radio value="RESTART_REQUIRED">
              重启生效
            </el-radio>
          </el-radio-group>
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
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import {
  friendlyConfigErrorMessage,
  systemParameterApi,
} from '@/api/config'
import type {
  ParameterEffectType,
  ParameterType,
  SystemParameterItem,
} from '@/api/config'

/** 权限码：列表可见性由 bootstrap 菜单保证，写操作按钮由 v-permission 指令控制 */
const updatePermission = 'system:parameter:update'

const TYPE_OPTIONS: Array<{ value: ParameterType; label: string }> = [
  { value: 'STRING', label: 'STRING（字符串）' },
  { value: 'INTEGER', label: 'INTEGER（整数）' },
  { value: 'LONG', label: 'LONG（长整数）' },
  { value: 'DECIMAL', label: 'DECIMAL（小数）' },
  { value: 'BOOLEAN', label: 'BOOLEAN（布尔）' },
  { value: 'JSON', label: 'JSON（JSON 对象）' },
]

function typeLabel(type: ParameterType): string {
  return TYPE_OPTIONS.find((option) => option.value === type)?.label ?? type
}

function isNumericType(type: ParameterType): boolean {
  return type === 'INTEGER' || type === 'LONG' || type === 'DECIMAL'
}

const loading = ref(false)
const records = ref<SystemParameterItem[]>([])
const total = ref(0)
const page = ref(1)
const size = ref(20)

const filters = reactive<{ group: string }>({ group: '' })

async function loadPage(): Promise<void> {
  loading.value = true
  try {
    const view = await systemParameterApi.page({
      group: filters.group,
      page: page.value,
      size: size.value,
    })
    records.value = view.items
    total.value = view.total
  } catch (ex) {
    ElMessage.error(friendlyConfigErrorMessage(ex, '系统参数加载失败'))
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
  type: 'STRING' as ParameterType,
  value: '',
  defaultValue: '',
  minValue: '',
  maxValue: '',
  effectType: 'DYNAMIC' as ParameterEffectType,
  publicFlag: false,
  description: '',
  changeReason: '',
})

/** 字符串值 <-> el-input-number（空串归一化为 undefined） */
function numModel(getter: () => string, setter: (v: string) => void) {
  return computed<number | undefined>({
    get() {
      const raw = getter()
      if (raw === '') return undefined
      const n = Number(raw)
      return Number.isNaN(n) ? undefined : n
    },
    set(v) {
      setter(v === null || v === undefined ? '' : String(v))
    },
  })
}

const numValue = numModel(() => form.value, (v) => { form.value = v })
const numDefault = numModel(() => form.defaultValue, (v) => { form.defaultValue = v })
const numMin = numModel(() => form.minValue, (v) => { form.minValue = v })
const numMax = numModel(() => form.maxValue, (v) => { form.maxValue = v })

/** 字符串值 <-> el-switch（'true' / 'false'） */
function boolModel(getter: () => string, setter: (v: string) => void) {
  return computed<boolean>({
    get: () => getter() === 'true',
    set: (v) => setter(v ? 'true' : 'false'),
  })
}

const boolValue = boolModel(() => form.value, (v) => { form.value = v })
const boolDefault = boolModel(() => form.defaultValue, (v) => { form.defaultValue = v })

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

function resetValueFields(): void {
  form.value = ''
  form.defaultValue = ''
  form.minValue = ''
  form.maxValue = ''
}

/** 新建时切换类型：清空旧类型下的值，避免把布尔串提交给整数类型（后端 B0601 终验） */
function handleTypeChange(): void {
  if (editingKey.value === null) resetValueFields()
}

function openCreate(): void {
  editingKey.value = null
  dialogVisible.value = true
}

function openEdit(row: SystemParameterItem): void {
  editingKey.value = row.key
  editingVersion.value = row.version
  form.key = row.key
  form.name = row.name
  form.group = row.group
  form.type = row.type
  form.value = row.value
  form.defaultValue = row.defaultValue ?? ''
  form.minValue = row.minValue ?? ''
  form.maxValue = row.maxValue ?? ''
  form.effectType = row.effectType
  form.publicFlag = row.publicFlag
  form.description = row.description
  form.changeReason = ''
  dialogVisible.value = true
}

/** 提交前按类型做前端初筛；最终合法性由后端 B0601 兜底 */
function validateByType(): string | null {
  // 返回值：number 解析成功；string 为错误文案；null 表示未填写
  const requireFinite = (raw: string, label: string): number | string | null => {
    if (raw === '') return null
    const n = Number(raw)
    if (!Number.isFinite(n)) return `${label}必须是有限数字`
    if (form.type !== 'DECIMAL' && !Number.isInteger(n)) return `${label}必须是整数`
    return n
  }

  if (form.type === 'JSON') {
    if (form.value.trim() === '') return '参数值不能为空'
    try {
      JSON.parse(form.value)
    } catch {
      return '参数值不是合法 JSON'
    }
    if (form.defaultValue.trim() !== '') {
      try {
        JSON.parse(form.defaultValue)
      } catch {
        return '默认值不是合法 JSON'
      }
    }
  } else if (isNumericType(form.type)) {
    if (form.value === '') return '参数值不能为空'
    const value = requireFinite(form.value, '参数值')
    if (typeof value === 'string') return value
    const min = requireFinite(form.minValue, '最小值')
    if (typeof min === 'string') return min
    const max = requireFinite(form.maxValue, '最大值')
    if (typeof max === 'string') return max
    if (min !== null && (value as number) < min) return '参数值不能小于最小值'
    if (max !== null && (value as number) > max) return '参数值不能大于最大值'
    if (min !== null && max !== null && min > max) return '最小值不能大于最大值'
  } else if (form.type === 'BOOLEAN') {
    if (form.value !== 'true' && form.value !== 'false') return '布尔参数值必须为 true/false'
  } else if (form.value.trim() === '') {
    return '参数值不能为空'
  }
  return null
}

function optionalValue(value: string): string | undefined {
  const trimmed = value.trim()
  return trimmed === '' ? undefined : trimmed
}

async function submitForm(): Promise<void> {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  const typeError = validateByType()
  if (typeError) {
    ElMessage.warning(typeError)
    return
  }
  submitting.value = true
  const base = {
    name: form.name.trim(),
    group: form.group.trim(),
    value: form.value.trim(),
    defaultValue: optionalValue(form.defaultValue),
    minValue: isNumericType(form.type) ? optionalValue(form.minValue) : undefined,
    maxValue: isNumericType(form.type) ? optionalValue(form.maxValue) : undefined,
    effectType: form.effectType,
    publicFlag: form.publicFlag,
    description: form.description.trim(),
  }
  try {
    if (editingKey.value === null) {
      await systemParameterApi.create({
        key: form.key.trim(),
        type: form.type,
        ...base,
      })
      ElMessage.success('系统参数创建成功')
    } else {
      // 乐观锁：携带行内 version，冲突时后端返回 B0604
      await systemParameterApi.update(editingKey.value, {
        ...base,
        version: editingVersion.value,
        changeReason: form.changeReason.trim(),
      })
      ElMessage.success('系统参数已更新')
    }
    dialogVisible.value = false
    await loadPage()
  } catch (ex) {
    ElMessage.error(friendlyConfigErrorMessage(ex, '保存失败'))
  } finally {
    submitting.value = false
  }
}

function resetForm(): void {
  form.key = ''
  form.name = ''
  form.group = ''
  form.type = 'STRING'
  resetValueFields()
  form.effectType = 'DYNAMIC'
  form.publicFlag = false
  form.description = ''
  form.changeReason = ''
  formRef.value?.clearValidate()
}

// ── 删除（系统参数删除无需原因，内置行按钮已禁用兜底 B0601） ─────

async function confirmRemove(row: SystemParameterItem): Promise<void> {
  try {
    await ElMessageBox.confirm(
      `确认删除系统参数「${row.name}」（${row.key}）？删除后不可恢复。`,
      '删除确认',
      {
        type: 'warning',
        confirmButtonText: '删除',
        cancelButtonText: '取消',
      },
    )
  } catch {
    return // 用户取消
  }
  try {
    await systemParameterApi.remove(row.key)
    ElMessage.success('系统参数已删除')
    await loadPage()
  } catch (ex) {
    ElMessage.error(friendlyConfigErrorMessage(ex, '删除失败'))
  }
}

onMounted(() => {
  void loadPage()
})
</script>

<style scoped>
.system-parameter-page {
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

.form-hint {
  margin-left: 12px;
  color: var(--el-text-color-placeholder);
  font-size: 12px;
}

.disabled-action-wrap {
  display: inline-block;
  cursor: not-allowed;
}
</style>
