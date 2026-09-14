<template>
  <div class="product-edit-page">
    <el-card shadow="never">
      <template #header><SectionTitle title="商品信息" hint="维护商品归属与面向消费者展示的基础内容" /></template>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" @submit.prevent>
        <div class="form-grid">
          <el-form-item label="商品编码" prop="code">
            <el-input v-model="form.code" maxlength="32" placeholder="如 PHONE-2026-001" :disabled="!!editingId" />
          </el-form-item>
          <el-form-item label="商品名称" prop="name">
            <el-input v-model="form.name" maxlength="128" show-word-limit placeholder="请输入商品名称" />
          </el-form-item>
          <el-form-item label="分类" prop="categoryId">
            <el-cascader v-model="form.categoryId" :options="categoryTree"
              :props="{ value: 'id', label: 'name', children: 'children' }" class="field-control" clearable />
          </el-form-item>
          <el-form-item label="品牌" prop="brandId">
            <el-select v-model="form.brandId" placeholder="选择品牌" class="field-control">
              <el-option v-for="brand in brands" :key="brand.id" :label="brand.name" :value="brand.id" />
            </el-select>
          </el-form-item>
        </div>
        <el-form-item label="副标题"><el-input v-model="form.subtitle" maxlength="255" show-word-limit placeholder="一句话概括商品卖点" /></el-form-item>
        <el-form-item label="商品描述">
          <el-input v-model="form.description" type="textarea" :rows="4" maxlength="2000" show-word-limit
            placeholder="补充商品详情、适用场景或售卖说明" />
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never">
      <template #header>
        <SectionTitle title="商品图片" hint="有图片时必须且只能指定一张主图">
          <el-button :icon="Plus" @click="addImage">添加图片</el-button>
        </SectionTitle>
      </template>
      <el-empty v-if="images.length === 0" description="暂未添加商品图片" :image-size="64" />
      <el-radio-group v-else v-model="mainImageIndex" class="editor-list">
        <div v-for="(image, index) in images" :key="index" class="editor-row image-row">
          <el-radio :value="index">主图</el-radio>
          <el-input v-model="image.objectKey" placeholder="对象存储 Key" />
          <el-input v-model="image.imageUrl" placeholder="https://... 图片地址" />
          <el-select v-model="image.imageType" class="image-type">
            <el-option label="展示图" value="GALLERY" />
            <el-option label="详情图" value="DETAIL" />
            <el-option label="SKU 图" value="SKU" />
          </el-select>
          <el-button link type="danger" @click="removeImage(index)">删除</el-button>
        </div>
      </el-radio-group>
    </el-card>

    <el-card shadow="never">
      <template #header>
        <SectionTitle title="商品属性" hint="例如材质、产地、保修期等非销售规格">
          <el-button :icon="Plus" @click="addAttribute">添加属性</el-button>
        </SectionTitle>
      </template>
      <el-empty v-if="attributes.length === 0" description="暂未添加商品属性" :image-size="64" />
      <div v-else class="editor-list">
        <div v-for="(attribute, index) in attributes" :key="index" class="editor-row attribute-row">
          <el-input v-model="attribute.name" placeholder="属性名，如材质" />
          <el-input v-model="attribute.value" placeholder="属性值，如铝合金" />
          <el-input-number v-model="attribute.sortOrder" :min="0" controls-position="right" />
          <el-button link type="danger" @click="attributes.splice(index, 1)">删除</el-button>
        </div>
      </div>
    </el-card>

    <el-card shadow="never">
      <template #header>
        <SectionTitle title="SKU 管理"
          :hint="editingId ? 'SKU 编码与规格创建后不可修改，可继续改价、换图或调整状态' : '新建商品至少添加一个 SKU，保存时与商品原子创建'">
          <el-button v-if="editingId ? has('product:sku:create') : has('product:product:create')"
            type="primary" :icon="Plus" @click="openSkuDialog">新增 SKU</el-button>
        </SectionTitle>
      </template>
      <el-table :data="skus" border>
        <el-table-column prop="skuCode" label="SKU 编码" min-width="150" />
        <el-table-column label="规格组合" min-width="220">
          <template #default="{ row }">
            <el-tag v-for="spec in row.specifications" :key="`${spec.name}-${spec.value}`" class="spec-tag">
              {{ spec.name }}：{{ spec.value }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="售价" width="130" align="right">
          <template #default="{ row }">¥ {{ (row.salePriceInCents / 100).toFixed(2) }}</template>
        </el-table-column>
        <el-table-column prop="mainImageUrl" label="SKU 主图" min-width="170" show-overflow-tooltip />
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }"><el-tag :type="row.status === 'ENABLED' ? 'success' : 'info'">
            {{ row.status === 'ENABLED' ? '启用' : '禁用' }}
          </el-tag></template>
        </el-table-column>
        <el-table-column label="操作" width="170" align="center" fixed="right">
          <template #default="{ row }">
            <el-button v-if="!editingId || has('product:sku:update')" link type="primary"
              @click="editSku(row as EditableSku)">编辑</el-button>
            <el-button v-if="!editingId" link type="danger" @click="removeLocalSku(row as EditableSku)">删除</el-button>
            <el-button v-else-if="has('product:sku:disable')" link
              :type="row.status === 'ENABLED' ? 'danger' : 'success'" @click="toggleSku(row as EditableSku)">
              {{ row.status === 'ENABLED' ? '禁用' : '启用' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <div class="actions">
      <span class="save-hint">{{ editingId ? '修改将立即保存' : '商品、图片、属性与 SKU 将一次提交' }}</span>
      <el-button @click="goBack">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="submit">保存商品</el-button>
    </div>

    <el-dialog v-model="skuDialogVisible"
      :title="skuEditingId === null && skuEditingIndex === null ? '新增 SKU' : '编辑 SKU'"
      width="560px" @closed="resetSkuForm">
      <el-form ref="skuFormRef" :model="skuForm" :rules="skuRules" label-width="100px" @submit.prevent>
        <el-form-item v-if="skuEditingId === null" label="SKU 编码" prop="skuCode">
          <el-input v-model="skuForm.skuCode" maxlength="64" placeholder="全局唯一编码" />
        </el-form-item>
        <el-form-item v-if="skuEditingId === null" label="规格组合">
          <div class="spec-list">
            <div v-for="(_, index) in skuForm.specifications" :key="index" class="spec-row">
              <el-input v-model="skuForm.specifications[index].name" placeholder="规格名，如颜色" />
              <el-input v-model="skuForm.specifications[index].value" placeholder="规格值，如曜石黑" />
              <el-button link type="danger" :disabled="skuForm.specifications.length <= 1"
                @click="removeSpec(index)">删除</el-button>
            </div>
            <el-button link type="primary" @click="addSpec">+ 添加规格</el-button>
          </div>
        </el-form-item>
        <el-form-item label="售价（分）" prop="salePriceInCents">
          <el-input-number v-model="skuForm.salePriceInCents" :min="0" controls-position="right" />
          <span class="price-preview">即 ¥ {{ (skuForm.salePriceInCents / 100).toFixed(2) }}</span>
        </el-form-item>
        <el-form-item label="SKU 主图"><el-input v-model="skuForm.mainImageUrl" placeholder="可选，https://..." /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="skuDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="skuSubmitting" @click="submitSku">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { defineComponent, h, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'
import { productApi } from '@/api/product/product'
import type { AttributePayload, ImagePayload, SaveSkuPayload, SkuStatus, SpecificationView } from '@/api/product/product'
import { categoryApi } from '@/api/product/category'
import type { CategoryNode } from '@/api/product/category'
import { brandApi } from '@/api/product/brand'
import type { BrandItem } from '@/api/product/brand'
import { usePermission } from '@/composables/usePermission'
import { buildCreateProductPayload, buildProductPayload } from './product-editor'

const SectionTitle = defineComponent({
  props: { title: { type: String, required: true }, hint: { type: String, required: true } },
  setup(props, { slots }) {
    return () => h('div', { class: 'section-heading' }, [
      h('div', [h('strong', props.title), h('p', props.hint)]),
      slots.default?.(),
    ])
  },
})

interface EditableSku extends Omit<SaveSkuPayload, 'mainImageUrl'> {
  id: number
  status: SkuStatus
  mainImageUrl: string | null
}

const { has } = usePermission()
const route = useRoute()
const router = useRouter()
const editingId = ref<number | null>(null)
const submitting = ref(false)
const formRef = ref<FormInstance>()
const categoryTree = ref<CategoryNode[]>([])
const brands = ref<BrandItem[]>([])
const images = ref<ImagePayload[]>([])
const attributes = ref<AttributePayload[]>([])
const skus = ref<EditableSku[]>([])
const mainImageIndex = ref(-1)
let localSkuId = -1

const form = reactive({ code: '', name: '', subtitle: '', description: '',
  categoryId: [] as number[], brandId: null as number | null })
const rules: FormRules = {
  code: [{ required: true, whitespace: true, message: '商品编码不能为空', trigger: 'blur' }],
  name: [{ required: true, whitespace: true, message: '商品名称不能为空', trigger: 'blur' }],
  categoryId: [{ required: true, message: '请选择分类', trigger: 'change' }],
  brandId: [{ required: true, message: '请选择品牌', trigger: 'change' }],
}

function addImage(): void {
  images.value.push({ objectKey: '', imageUrl: '', imageType: 'GALLERY', sortOrder: images.value.length, mainFlag: false })
  if (mainImageIndex.value < 0) mainImageIndex.value = 0
}
function removeImage(index: number): void {
  images.value.splice(index, 1)
  if (!images.value.length) mainImageIndex.value = -1
  else if (mainImageIndex.value === index) mainImageIndex.value = 0
  else if (mainImageIndex.value > index) mainImageIndex.value -= 1
}
function addAttribute(): void {
  attributes.value.push({ name: '', value: '', sortOrder: attributes.value.length })
}

const skuDialogVisible = ref(false)
const skuSubmitting = ref(false)
const skuEditingId = ref<number | null>(null)
const skuEditingIndex = ref<number | null>(null)
const skuFormRef = ref<FormInstance>()
const skuForm = reactive({ skuCode: '', specifications: [{ name: '', value: '' }] as SpecificationView[],
  salePriceInCents: 0, mainImageUrl: '' })
const skuRules: FormRules = {
  skuCode: [{ required: true, whitespace: true, message: 'SKU 编码不能为空', trigger: 'blur' }],
  salePriceInCents: [{ required: true, message: '售价不能为空', trigger: 'blur' },
    { type: 'number', min: 0, message: '售价不能为负', trigger: 'blur' }],
}

function addSpec(): void { skuForm.specifications.push({ name: '', value: '' }) }
function removeSpec(index: number): void { skuForm.specifications.splice(index, 1) }
function openSkuDialog(): void { resetSkuForm(); skuDialogVisible.value = true }
function editSku(row: EditableSku): void {
  skuEditingId.value = editingId.value ? row.id : null
  skuEditingIndex.value = editingId.value ? null : skus.value.findIndex((sku) => sku.id === row.id)
  skuForm.skuCode = row.skuCode
  skuForm.specifications = row.specifications.map((spec) => ({ ...spec }))
  skuForm.salePriceInCents = row.salePriceInCents
  skuForm.mainImageUrl = row.mainImageUrl ?? ''
  skuDialogVisible.value = true
}

async function submitSku(): Promise<void> {
  if (!skuFormRef.value || !(await skuFormRef.value.validate().catch(() => false))) return
  const specifications = skuForm.specifications.map((spec) => ({ name: spec.name.trim(), value: spec.value.trim() }))
    .filter((spec) => spec.name && spec.value)
  if (!specifications.length) { ElMessage.warning('至少填写一组完整的 SKU 规格'); return }
  const payload: SaveSkuPayload = { skuCode: skuForm.skuCode.trim(), specifications,
    salePriceInCents: skuForm.salePriceInCents, mainImageUrl: skuForm.mainImageUrl.trim() || undefined }
  skuSubmitting.value = true
  try {
    if (!editingId.value) {
      const duplicate = skus.value.some((sku, index) =>
        sku.skuCode === payload.skuCode && index !== skuEditingIndex.value)
      if (duplicate) { ElMessage.warning('SKU 编码不能重复'); return }
      const item: EditableSku = { ...payload,
        id: skuEditingIndex.value === null ? localSkuId-- : skus.value[skuEditingIndex.value].id,
        status: 'ENABLED', mainImageUrl: payload.mainImageUrl ?? null }
      if (skuEditingIndex.value === null) skus.value.push(item)
      else skus.value.splice(skuEditingIndex.value, 1, item)
      ElMessage.success('SKU 已加入待保存列表')
    } else if (skuEditingId.value === null) {
      await productApi.addSku(editingId.value, payload)
      await reloadProduct()
      ElMessage.success('SKU 创建成功')
    } else {
      await productApi.updateSku(editingId.value, skuEditingId.value,
        { salePriceInCents: payload.salePriceInCents, mainImageUrl: payload.mainImageUrl })
      await reloadProduct()
      ElMessage.success('SKU 已更新')
    }
    skuDialogVisible.value = false
  } catch {
    // HTTP 拦截器统一展示请求错误，这里只负责终止页面异步链。
  } finally { skuSubmitting.value = false }
}
function resetSkuForm(): void {
  skuEditingId.value = null; skuEditingIndex.value = null; skuForm.skuCode = ''
  skuForm.specifications = [{ name: '', value: '' }]; skuForm.salePriceInCents = 0
  skuForm.mainImageUrl = ''; skuFormRef.value?.clearValidate()
}
function removeLocalSku(row: EditableSku): void { skus.value = skus.value.filter((sku) => sku.id !== row.id) }
async function toggleSku(row: EditableSku): Promise<void> {
  if (!editingId.value) return
  const enabling = row.status !== 'ENABLED'
  try {
    await ElMessageBox.confirm(enabling ? `确认启用 SKU「${row.skuCode}」？` : `确认禁用 SKU「${row.skuCode}」？`,
      '状态变更确认', { type: 'warning', confirmButtonText: '确定', cancelButtonText: '取消' })
  } catch { return }
  try {
    await productApi.changeSkuStatus(editingId.value, row.id, enabling ? 'ENABLED' : 'DISABLED')
    await reloadProduct()
    ElMessage.success(enabling ? '已启用' : '已禁用')
  } catch {
    // HTTP 拦截器统一展示请求错误。
  }
}

async function loadOptions(): Promise<void> {
  const [tree, brandView] = await Promise.all([categoryApi.tree(), brandApi.page({ page: 1, size: 100 })])
  categoryTree.value = tree; brands.value = brandView.records
}
async function reloadProduct(): Promise<void> {
  if (!editingId.value) return
  const view = await productApi.getById(editingId.value)
  skus.value = view.skus.map((sku) => ({ ...sku }))
}
function validateCollections(): boolean {
  if (images.value.some((image) => !image.objectKey.trim() || !image.imageUrl.trim())) {
    ElMessage.warning('请补全商品图片的对象 Key 和图片地址'); return false
  }
  if (images.value.length && mainImageIndex.value < 0) { ElMessage.warning('请选择一张商品主图'); return false }
  if (attributes.value.some((attribute) => !attribute.name.trim() || !attribute.value.trim())) {
    ElMessage.warning('请补全商品属性名称和值'); return false
  }
  if (!editingId.value && !skus.value.length) { ElMessage.warning('新建商品至少需要一个 SKU'); return false }
  return true
}
async function submit(): Promise<void> {
  if (!formRef.value || !(await formRef.value.validate().catch(() => false)) || !validateCollections()) return
  const payload = buildProductPayload(form, images.value, attributes.value, mainImageIndex.value)
  submitting.value = true
  try {
    if (!editingId.value) {
      const createPayload = buildCreateProductPayload(form, payload, skus.value)
      editingId.value = (await productApi.create(createPayload)).id
      ElMessage.success('商品与 SKU 已创建')
    } else {
      await productApi.update(editingId.value, payload)
      ElMessage.success('商品已更新')
    }
    await reloadProduct()
  } catch {
    // HTTP 拦截器统一展示请求错误，这里只负责恢复提交状态。
  } finally { submitting.value = false }
}
function goBack(): void { router.push({ name: 'ProductList' }) }

async function initialize(): Promise<void> {
  await loadOptions()
  if (!route.query.id) return
  editingId.value = Number(route.query.id)
  const view = await productApi.getById(editingId.value)
  Object.assign(form, { code: view.code, name: view.name, subtitle: view.subtitle ?? '',
    description: view.description ?? '', brandId: view.brandId, categoryId: [view.categoryId] })
  images.value = view.images.map((image) => ({ ...image }))
  attributes.value = view.attributes.map((attribute) => ({ ...attribute }))
  skus.value = view.skus.map((sku) => ({ ...sku }))
  mainImageIndex.value = images.value.findIndex((image) => image.mainFlag)
}

onMounted(() => {
  void initialize().catch(() => {
    // HTTP 拦截器统一展示初始化请求错误。
  })
})
</script>

<style scoped>
.product-edit-page { display: flex; flex-direction: column; gap: 16px; max-width: 1200px; margin: 0 auto; }
:deep(.section-heading) { display: flex; align-items: center; justify-content: space-between; gap: 24px; }
:deep(.section-heading strong) { color: var(--el-text-color-primary); font-size: 16px; }
:deep(.section-heading p) { margin: 5px 0 0; color: var(--el-text-color-secondary); font-size: 13px; }
.form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); column-gap: 28px; }
.field-control { width: 100%; }
.editor-list { display: flex; width: 100%; flex-direction: column; gap: 10px; }
.editor-row { display: grid; align-items: center; gap: 10px; padding: 12px;
  border: 1px solid var(--el-border-color-lighter); border-radius: 6px; background: var(--el-fill-color-extra-light); }
.image-row { grid-template-columns: 68px minmax(140px, .8fr) minmax(230px, 1.5fr) 110px 48px; }
.attribute-row { grid-template-columns: minmax(180px, .8fr) minmax(250px, 1.4fr) 130px 48px; }
.image-type { width: 110px; }
.spec-tag { margin: 2px 6px 2px 0; }
.spec-list { display: flex; width: 100%; flex-direction: column; gap: 8px; }
.spec-row { display: grid; grid-template-columns: 1fr 1fr 48px; gap: 8px; }
.price-preview, .save-hint { color: var(--el-text-color-secondary); font-size: 13px; }
.price-preview { margin-left: 12px; }
.actions { position: sticky; z-index: 4; bottom: 0; display: flex; align-items: center; justify-content: flex-end;
  gap: 10px; padding: 14px 18px; border: 1px solid var(--el-border-color-lighter); border-radius: 8px;
  background: color-mix(in srgb, var(--el-bg-color) 94%, transparent); box-shadow: 0 -6px 20px rgb(15 23 42 / 6%); }
.save-hint { margin-right: auto; }
</style>
