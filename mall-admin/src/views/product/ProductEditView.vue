<template>
  <div class="product-edit-page">
    <el-card shadow="never">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" @submit.prevent>
        <el-form-item label="商品编码" prop="code">
          <el-input v-model="form.code" maxlength="32" placeholder="1~32 个字符" :disabled="!!editingId" />
        </el-form-item>
        <el-form-item label="商品名称" prop="name">
          <el-input v-model="form.name" maxlength="128" show-word-limit placeholder="1~128 个字符" />
        </el-form-item>
        <el-form-item label="副标题" prop="subtitle">
          <el-input v-model="form.subtitle" maxlength="255" placeholder="可留空" />
        </el-form-item>
        <el-form-item label="商品描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            maxlength="2000"
            show-word-limit
            placeholder="可留空"
          />
        </el-form-item>
        <el-form-item label="分类" prop="categoryId">
          <el-cascader
            v-model="form.categoryId"
            :options="categoryTree"
            :props="{ value: 'id', label: 'name', children: 'children' }"
            style="width: 320px"
            clearable
          />
        </el-form-item>
        <el-form-item label="品牌" prop="brandId">
          <el-select v-model="form.brandId" placeholder="选择品牌" style="width: 320px">
            <el-option v-for="b in brands" :key="b.id" :label="b.name" :value="b.id" />
          </el-select>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- SKU 管理 -->
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>SKU 管理</span>
          <el-button
            v-if="has('product:sku:create') && editingId"
            type="primary"
            :icon="Plus"
            @click="openSkuDialog"
          >
            新增 SKU
          </el-button>
        </div>
      </template>
      <el-table :data="skus" border stripe>
        <el-table-column prop="skuCode" label="SKU 编码" width="140" />
        <el-table-column label="规格组合" min-width="200">
          <template #default="{ row }">
            <el-tag v-for="spec in row.specifications" :key="spec.name" class="spec-tag">
              {{ spec.name }}: {{ spec.value }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="售价(分)" width="120" align="center">
          <template #default="{ row }">{{ row.salePriceInCents }}</template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 'ENABLED' ? 'success' : 'info'">
              {{ row.status === 'ENABLED' ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" align="center" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="has('product:sku:update')"
              link
              type="primary"
              @click="editSku(row as SkuView)"
            >
              改价
            </el-button>
            <el-button
              v-if="has('product:sku:disable')"
              link
              :type="row.status === 'ENABLED' ? 'danger' : 'success'"
              @click="toggleSku(row as SkuView)"
            >
              {{ row.status === 'ENABLED' ? '禁用' : '启用' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <div class="actions">
      <el-button @click="goBack">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="submit">保存</el-button>
    </div>

    <!-- SKU 弹窗 -->
    <el-dialog
      v-model="skuDialogVisible"
      :title="skuEditingId === null ? '新增 SKU' : '修改 SKU 价格'"
      width="520px"
      @closed="resetSkuForm"
    >
      <el-form ref="skuFormRef" :model="skuForm" :rules="skuRules" label-width="100px" @submit.prevent>
        <el-form-item v-if="skuEditingId === null" label="SKU 编码" prop="skuCode">
          <el-input v-model="skuForm.skuCode" maxlength="64" placeholder="全局唯一编码" />
        </el-form-item>
        <el-form-item v-if="skuEditingId === null" label="规格组合" prop="specifications">
          <div class="spec-list">
            <div v-for="(_, idx) in skuForm.specifications" :key="idx" class="spec-row">
              <el-input v-model="skuForm.specifications[idx].name" placeholder="规格名（如颜色）" style="width: 140px" />
              <el-input v-model="skuForm.specifications[idx].value" placeholder="规格值（如黑）" style="width: 140px" />
              <el-button link type="danger" @click="removeSpec(idx)" :disabled="skuForm.specifications.length <= 1">
                删除
              </el-button>
            </div>
            <el-button link type="primary" @click="addSpec">+ 添加规格</el-button>
          </div>
        </el-form-item>
        <el-form-item label="售价(分)" prop="salePriceInCents">
          <el-input-number v-model="skuForm.salePriceInCents" :min="0" controls-position="right" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="skuDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="skuSubmitting" @click="submitSku">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'
import { productApi } from '@/api/product/product'
import type {
  SaveProductPayload,
  SkuView,
  SpecificationView,
} from '@/api/product/product'
import { categoryApi } from '@/api/product/category'
import type { CategoryNode } from '@/api/product/category'
import { brandApi } from '@/api/product/brand'
import type { BrandItem } from '@/api/product/brand'
import { usePermission } from '@/composables/usePermission'

const { has } = usePermission()
const route = useRoute()
const router = useRouter()

const editingId = ref<number | null>(null)
const submitting = ref(false)
const formRef = ref<FormInstance>()
const categoryTree = ref<CategoryNode[]>([])
const brands = ref<BrandItem[]>([])
const skus = ref<SkuView[]>([])

const form = reactive({
  code: '',
  name: '',
  subtitle: '',
  description: '',
  categoryId: [] as number[],
  brandId: null as number | null,
})

const rules: FormRules = {
  code: [{ required: true, whitespace: true, message: '商品编码不能为空', trigger: 'blur' }],
  name: [{ required: true, whitespace: true, message: '商品名称不能为空', trigger: 'blur' }],
  categoryId: [{ required: true, message: '请选择分类', trigger: 'change' }],
  brandId: [{ required: true, message: '请选择品牌', trigger: 'change' }],
}

// ---------- SKU ----------

const skuDialogVisible = ref(false)
const skuSubmitting = ref(false)
const skuEditingId = ref<number | null>(null)
const skuFormRef = ref<FormInstance>()
const skuForm = reactive({
  skuCode: '',
  specifications: [{ name: '', value: '' }] as SpecificationView[],
  salePriceInCents: 0,
  mainImageUrl: '',
})

const skuRules: FormRules = {
  skuCode: [{ required: true, whitespace: true, message: 'SKU 编码不能为空', trigger: 'blur' }],
  salePriceInCents: [
    { required: true, message: '售价不能为空', trigger: 'blur' },
    { type: 'number', min: 0, message: '售价不能为负', trigger: 'blur' },
  ],
}

function addSpec(): void {
  skuForm.specifications.push({ name: '', value: '' })
}

function removeSpec(idx: number): void {
  skuForm.specifications.splice(idx, 1)
}

function openSkuDialog(): void {
  skuEditingId.value = null
  skuDialogVisible.value = true
}

function editSku(row: SkuView): void {
  skuEditingId.value = row.id
  skuForm.skuCode = row.skuCode
  skuForm.salePriceInCents = row.salePriceInCents
  skuForm.mainImageUrl = row.mainImageUrl ?? ''
  skuDialogVisible.value = true
}

async function submitSku(): Promise<void> {
  if (!skuFormRef.value) return
  const valid = await skuFormRef.value.validate().catch(() => false)
  if (!valid) return
  skuSubmitting.value = true
  try {
    if (skuEditingId.value === null) {
      const specs = skuForm.specifications.filter((s) => s.name && s.value)
      await productApi.addSku(editingId.value!, {
        skuCode: skuForm.skuCode.trim(),
        specifications: specs,
        salePriceInCents: skuForm.salePriceInCents,
      })
      ElMessage.success('SKU 创建成功')
    } else {
      await productApi.updateSku(editingId.value!, skuEditingId.value, {
        salePriceInCents: skuForm.salePriceInCents,
        mainImageUrl: skuForm.mainImageUrl || undefined,
      })
      ElMessage.success('SKU 已更新')
    }
    skuDialogVisible.value = false
    await reloadProduct()
  } catch {
    // 错误由拦截器提示
  } finally {
    skuSubmitting.value = false
  }
}

function resetSkuForm(): void {
  skuForm.skuCode = ''
  skuForm.specifications = [{ name: '', value: '' }]
  skuForm.salePriceInCents = 0
  skuForm.mainImageUrl = ''
  skuFormRef.value?.clearValidate()
}

async function toggleSku(row: SkuView): Promise<void> {
  const enabling = row.status !== 'ENABLED'
  try {
    await ElMessageBox.confirm(
      enabling ? `确认启用 SKU「${row.skuCode}」？` : `确认禁用 SKU「${row.skuCode}」？`,
      '状态变更确认',
      { type: 'warning', confirmButtonText: '确定', cancelButtonText: '取消' },
    )
  } catch {
    return
  }
  try {
    await productApi.changeSkuStatus(editingId.value!, row.id, enabling ? 'ENABLED' : 'DISABLED')
    ElMessage.success(enabling ? '已启用' : '已禁用')
    await reloadProduct()
  } catch {
    // 错误由拦截器提示
  }
}

// ---------- 商品 ----------

async function loadOptions(): Promise<void> {
  try {
    const [tree, brandView] = await Promise.all([
      categoryApi.tree(),
      brandApi.page({ page: 1, size: 100 }),
    ])
    categoryTree.value = tree
    brands.value = brandView.records
  } catch {
    // 忽略
  }
}

async function reloadProduct(): Promise<void> {
  if (!editingId.value) return
  const view = await productApi.getById(editingId.value)
  skus.value = view.skus
}

async function submit(): Promise<void> {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  submitting.value = true
  const payload: SaveProductPayload = {
    name: form.name.trim(),
    subtitle: form.subtitle.trim() || undefined,
    description: form.description.trim() || undefined,
    categoryId: form.categoryId[form.categoryId.length - 1],
    brandId: form.brandId!,
    images: [],
    attributes: [],
  }
  if (editingId.value === null) {
    payload.code = form.code.trim()
  }
  try {
    if (editingId.value === null) {
      const result = await productApi.create(payload)
      editingId.value = result.id
      ElMessage.success('商品创建成功')
    } else {
      await productApi.update(editingId.value, payload)
      ElMessage.success('商品已更新')
    }
    await reloadProduct()
  } catch {
    // 错误由拦截器提示
  } finally {
    submitting.value = false
  }
}

function goBack(): void {
  router.push({ name: 'ProductList' })
}

onMounted(async () => {
  await loadOptions()
  const id = route.query.id
  if (id) {
    editingId.value = Number(id)
    const view = await productApi.getById(editingId.value)
    form.code = view.code
    form.name = view.name
    form.subtitle = view.subtitle ?? ''
    form.description = view.description ?? ''
    form.brandId = view.brandId
    skus.value = view.skus
    // 分类回显需要构造层级路径，这里简化为只选叶子节点
    form.categoryId = [view.categoryId]
  }
})
</script>

<style scoped>
.product-edit-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.spec-tag {
  margin-right: 6px;
}
.spec-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.spec-row {
  display: flex;
  gap: 8px;
  align-items: center;
}
.actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
