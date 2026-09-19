<template>
  <div class="brand-page">
    <!-- 查询区 -->
    <el-card
      class="filter-card"
      shadow="never"
    >
      <el-form
        :inline="true"
        @submit.prevent
      >
        <el-form-item label="品牌名称">
          <el-input
            v-model="filters.keyword"
            placeholder="按名称模糊搜索"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
            @clear="handleSearch"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="filters.status"
            placeholder="全部状态"
            clearable
            style="width: 140px"
          >
            <el-option
              label="启用"
              value="ENABLED"
            />
            <el-option
              label="禁用"
              value="DISABLED"
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
          v-if="has('product:brand:create')"
          type="primary"
          :icon="Plus"
          @click="openCreate"
        >
          新增品牌
        </el-button>
      </div>

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
          label="Logo"
          width="90"
          align="center"
        >
          <template #default="{ row }">
            <el-image
              v-if="(row as BrandItem).logo"
              :src="(row as BrandItem).logo as string"
              fit="contain"
              class="logo-thumb"
              :preview-src-list="[(row as BrandItem).logo as string]"
              preview-teleported
            >
              <template #error>
                <el-icon class="logo-fallback">
                  <PictureFilled />
                </el-icon>
              </template>
            </el-image>
            <span
              v-else
              class="logo-empty"
            >—</span>
          </template>
        </el-table-column>
        <el-table-column
          prop="name"
          label="品牌名称"
          min-width="140"
          show-overflow-tooltip
        />
        <el-table-column
          prop="description"
          label="描述"
          min-width="200"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            {{ (row as BrandItem).description || '—' }}
          </template>
        </el-table-column>
        <el-table-column
          prop="sort"
          label="排序"
          width="90"
          align="center"
        />
        <el-table-column
          label="状态"
          width="100"
          align="center"
        >
          <template #default="{ row }">
            <el-tag :type="(row as BrandItem).status === 'ENABLED' ? 'success' : 'info'">
              {{ (row as BrandItem).status === 'ENABLED' ? '启用' : '禁用' }}
            </el-tag>
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
              v-if="has('product:brand:update')"
              link
              type="primary"
              @click="openEdit(row as BrandItem)"
            >
              编辑
            </el-button>
            <el-button
              v-if="has('product:brand:disable')"
              link
              :type="(row as BrandItem).status === 'ENABLED' ? 'danger' : 'success'"
              @click="confirmToggle(row as BrandItem)"
            >
              {{ (row as BrandItem).status === 'ENABLED' ? '禁用' : '启用' }}
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

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="editingId === null ? '新增品牌' : '编辑品牌'"
      width="520px"
      @closed="resetForm"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="90px"
        @submit.prevent
      >
        <el-form-item
          label="品牌名称"
          prop="name"
        >
          <el-input
            v-model="form.name"
            maxlength="64"
            show-word-limit
            placeholder="1~64 个字符"
          />
        </el-form-item>
        <el-form-item
          label="Logo"
          prop="logo"
        >
          <el-input
            v-model="form.logo"
            maxlength="512"
            placeholder="http(s):// 图片地址，可留空"
          />
          <!-- CHG-0023：支持上传品牌图，成功后回填 URL 到输入框 -->
          <ImageUploader v-model="form.logo" scene="BRAND" />
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
            placeholder="不超过 255 个字符"
          />
        </el-form-item>
        <el-form-item
          label="排序"
          prop="sort"
        >
          <el-input-number
            v-model="form.sort"
            :min="0"
            :max="9999"
            controls-position="right"
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
import { Plus, PictureFilled } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { brandApi } from '@/api/product/brand'
import type { BrandItem, BrandStatus } from '@/api/product/brand'
import { usePermission } from '@/composables/usePermission'
import ImageUploader from './components/ImageUploader.vue'

const { has } = usePermission()

const loading = ref(false)
const records = ref<BrandItem[]>([])
const total = ref(0)
const page = ref(1)
const size = ref(20)

const filters = reactive<{ keyword: string; status: BrandStatus | '' }>({
  keyword: '',
  status: '',
})

async function loadPage(): Promise<void> {
  loading.value = true
  try {
    const view = await brandApi.page({
      keyword: filters.keyword.trim(),
      status: filters.status,
      page: page.value,
      size: size.value,
    })
    records.value = view.records
    total.value = view.total
  } catch {
    // 错误文案由 axios 拦截器统一提示，这里仅保证加载态结束
  } finally {
    loading.value = false
  }
}

function handleSearch(): void {
  page.value = 1
  void loadPage()
}

function handleReset(): void {
  filters.keyword = ''
  filters.status = ''
  page.value = 1
  void loadPage()
}

function handleSizeChange(): void {
  // 改变页大小后回到第一页
  page.value = 1
  void loadPage()
}

// ---------- 新增/编辑 ----------

const dialogVisible = ref(false)
const submitting = ref(false)
// CHG-0015：品牌雪花 ID 全程字符串
const editingId = ref<string | null>(null)
const formRef = ref<FormInstance>()

const form = reactive({
  name: '',
  logo: '',
  description: '',
  sort: 0,
})

const rules: FormRules = {
  name: [
    { required: true, whitespace: true, message: '品牌名称不能为空', trigger: 'blur' },
    { max: 64, message: '品牌名称不超过 64 个字符', trigger: 'blur' },
  ],
  logo: [
    {
      validator: (_rule, value: string, callback) => {
        const v = (value ?? '').trim()
        if (!v) {
          callback()
          return
        }
        if (v.length > 512) {
          callback(new Error('Logo 地址不超过 512 个字符'))
          return
        }
        // 前端只做形态初筛（协议 + 非空白主机路径），后端 Brand 聚合有严格 URI 终验
        if (!/^https?:\/\/\S+$/.test(v)) {
          callback(new Error('Logo 必须是合法的 http(s) URL'))
          return
        }
        callback()
      },
      trigger: 'blur',
    },
  ],
  description: [{ max: 255, message: '描述不超过 255 个字符', trigger: 'blur' }],
}

function openCreate(): void {
  editingId.value = null
  dialogVisible.value = true
}

function openEdit(row: BrandItem): void {
  editingId.value = row.id
  form.name = row.name
  form.logo = row.logo ?? ''
  form.description = row.description ?? ''
  form.sort = row.sort
  dialogVisible.value = true
}

async function submitForm(): Promise<void> {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  submitting.value = true
  const payload = {
    name: form.name.trim(),
    logo: form.logo.trim() || undefined,
    description: form.description.trim() || undefined,
    sort: form.sort,
  }
  try {
    if (editingId.value === null) {
      await brandApi.create(payload)
      ElMessage.success('品牌创建成功')
    } else {
      await brandApi.update(editingId.value, payload)
      ElMessage.success('品牌已更新')
    }
    dialogVisible.value = false
    await loadPage()
  } catch {
    // 服务端错误（如 409 重名）由拦截器提示，保留表单输入便于改名重试
  } finally {
    submitting.value = false
  }
}

function resetForm(): void {
  form.name = ''
  form.logo = ''
  form.description = ''
  form.sort = 0
  formRef.value?.clearValidate()
}

// ---------- 启停 ----------

async function confirmToggle(row: BrandItem): Promise<void> {
  const enabling = row.status !== 'ENABLED'
  try {
    await ElMessageBox.confirm(
      enabling ? `确认启用品牌「${row.name}」？` : `确认禁用品牌「${row.name}」？`,
      '状态变更确认',
      {
        type: 'warning',
        confirmButtonText: '确定',
        cancelButtonText: '取消',
      },
    )
  } catch {
    return // 用户取消
  }
  const next: BrandStatus = enabling ? 'ENABLED' : 'DISABLED'
  try {
    await brandApi.changeStatus(row.id, next)
    ElMessage.success(enabling ? '已启用' : '已禁用')
    await loadPage()
  } catch {
    // 错误由拦截器统一提示
  }
}

onMounted(() => {
  void loadPage()
})
</script>

<style scoped>
.brand-page {
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

.logo-thumb {
  width: 48px;
  height: 48px;
  border-radius: 4px;
  border: 1px solid var(--el-border-color-lighter);
}

.logo-fallback {
  font-size: 20px;
  color: var(--el-text-color-placeholder);
}

.logo-empty {
  color: var(--el-text-color-placeholder);
}

/* 子组件 ImageUploader 的根节点会继承本页 scoped 标记 */
.image-uploader {
  margin-top: 8px;
}
</style>
