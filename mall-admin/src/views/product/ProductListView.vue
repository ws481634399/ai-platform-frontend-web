<template>
  <div class="admin-page product-page">
    <!-- 查询区：扁平 toolbar，不嵌套卡片 -->
    <div class="product-page__toolbar">
      <el-form
        :inline="true"
        class="product-page__filter"
        @submit.prevent
      >
        <el-form-item label="商品名称">
          <el-input
            v-model="filters.keyword"
            placeholder="按名称/编码模糊搜索"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
            @clear="handleSearch"
          />
        </el-form-item>
        <el-form-item label="分类">
          <el-select
            v-model="filters.categoryId"
            placeholder="全部分类"
            clearable
            style="width: 160px"
          >
            <el-option
              v-for="cat in categories"
              :key="cat.id"
              :label="cat.name"
              :value="cat.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="品牌">
          <el-select
            v-model="filters.brandId"
            placeholder="全部品牌"
            clearable
            style="width: 160px"
          >
            <el-option
              v-for="brand in brands"
              :key="brand.id"
              :label="brand.name"
              :value="brand.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="filters.status"
            placeholder="全部状态"
            clearable
            style="width: 140px"
            @change="handleSearch"
          >
            <el-option
              label="草稿"
              value="DRAFT"
            />
            <el-option
              label="已上架"
              value="ON_SALE"
            />
            <el-option
              label="已下架"
              value="OFF_SALE"
            />
            <el-option
              label="已禁用"
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
    </div>

    <!-- 列表 -->
    <el-card
      shadow="never"
      class="product-page__card"
      body-style="padding: 0"
    >
      <div class="admin-toolbar product-page__toolbar-inner">
        <el-button
          v-if="has('product:product:create')"
          type="primary"
          :icon="Plus"
          @click="openCreate"
        >
          新增商品
        </el-button>
      </div>

      <el-table
        v-loading="loading"
        :data="records"
        stripe
        class="product-page__table"
      >
        <el-table-column
          prop="id"
          label="ID"
          width="190"
          class-name="tabular"
          show-overflow-tooltip
        />
        <el-table-column
          label="主图"
          width="80"
          align="center"
        >
          <template #default="{ row }">
            <el-image
              v-if="(row as ProductItem).mainImageUrl"
              :src="(row as ProductItem).mainImageUrl ?? ''"
              fit="contain"
              class="thumb"
              :preview-src-list="[(row as ProductItem).mainImageUrl ?? '']"
              preview-teleported
            >
              <template #error>
                <el-icon class="thumb-fallback">
                  <PictureFilled />
                </el-icon>
              </template>
            </el-image>
            <span
              v-else
              class="thumb-empty"
            >—</span>
          </template>
        </el-table-column>
        <el-table-column
          prop="code"
          label="商品编码"
          width="140"
          class-name="tabular"
        />
        <el-table-column
          prop="name"
          label="商品名称"
          min-width="160"
          show-overflow-tooltip
        />
        <el-table-column
          label="状态"
          width="100"
          align="center"
        >
          <template #default="{ row }">
            <el-tag
              :type="statusTagType((row as ProductItem).status)"
              size="small"
            >
              {{ statusLabel((row as ProductItem).status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          label="操作"
          width="240"
          align="center"
          fixed="right"
        >
          <template #default="{ row }">
            <el-button
              v-if="has('product:product:update')"
              link
              type="primary"
              @click="openEdit(row as ProductItem)"
            >
              编辑
            </el-button>
            <el-button
              v-if="has('product:product:publish') && (row as ProductItem).status !== 'ON_SALE' && (row as ProductItem).status !== 'DISABLED'"
              link
              type="success"
              @click="confirmPublish(row as ProductItem)"
            >
              上架
            </el-button>
            <el-button
              v-if="has('product:product:publish') && (row as ProductItem).status === 'ON_SALE'"
              link
              type="warning"
              @click="confirmUnpublish(row as ProductItem)"
            >
              下架
            </el-button>
            <el-button
              v-if="has('product:product:disable')"
              link
              type="danger"
              @click="confirmDisable(row as ProductItem)"
            >
              禁用
            </el-button>
          </template>
        </el-table-column>
        <template #empty>
          <div class="product-page__empty">
            暂无商品数据
          </div>
        </template>
      </el-table>

      <div class="admin-pager">
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
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, PictureFilled } from '@element-plus/icons-vue'
import { productApi } from '@/api/product/product'
import type { ProductItem, ProductStatus } from '@/api/product/product'
import { categoryApi } from '@/api/product/category'
import type { CategoryNode } from '@/api/product/category'
import { brandApi } from '@/api/product/brand'
import type { BrandItem } from '@/api/product/brand'
import { usePermission } from '@/composables/usePermission'
import { useRouter } from 'vue-router'

const { has } = usePermission()
const router = useRouter()

const loading = ref(false)
const records = ref<ProductItem[]>([])
const total = ref(0)
const page = ref(1)
const size = ref(20)
const categories = ref<CategoryNode[]>([])
const brands = ref<BrandItem[]>([])

const filters = reactive<{
  keyword: string
  // CHG-0015：分类/品牌雪花 ID 全程字符串
  categoryId: string | undefined
  brandId: string | undefined
  status: ProductStatus | ''
}>({
  keyword: '',
  categoryId: undefined,
  brandId: undefined,
  status: '',
})

async function loadPage(): Promise<void> {
  loading.value = true
  try {
    const view = await productApi.page({
      keyword: filters.keyword.trim(),
      categoryId: filters.categoryId,
      brandId: filters.brandId,
      status: filters.status,
      page: page.value,
      size: size.value,
    })
    records.value = view.records
    total.value = view.total
  } catch {
    // 错误由拦截器提示
  } finally {
    loading.value = false
  }
}

async function loadOptions(): Promise<void> {
  try {
    const [catView, brandView] = await Promise.all([
      categoryApi.tree(),
      brandApi.page({ page: 1, size: 100 }),
    ])
    categories.value = flattenCategories(catView)
    brands.value = brandView.records
  } catch {
    // 忽略
  }
}

function flattenCategories(tree: CategoryNode[]): CategoryNode[] {
  const result: CategoryNode[] = []
  const walk = (nodes: CategoryNode[]) => {
    for (const node of nodes) {
      result.push(node)
      if (node.children?.length) walk(node.children)
    }
  }
  walk(tree)
  return result
}

function handleSearch(): void {
  page.value = 1
  void loadPage()
}

function handleReset(): void {
  filters.keyword = ''
  filters.categoryId = undefined
  filters.brandId = undefined
  filters.status = ''
  page.value = 1
  void loadPage()
}

function handleSizeChange(): void {
  page.value = 1
  void loadPage()
}

function openCreate(): void {
  router.push({ name: 'ProductEdit' })
}

function openEdit(row: ProductItem): void {
  router.push({ name: 'ProductEdit', query: { id: row.id } })
}

async function confirmDisable(row: ProductItem): Promise<void> {
  try {
    await ElMessageBox.confirm(`确认禁用商品「${row.name}」？`, '状态变更确认', {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消',
    })
  } catch {
    return
  }
  try {
    await productApi.changeStatus(row.id, 'DISABLED')
    ElMessage.success('已禁用')
    await loadPage()
  } catch {
    // 错误由拦截器提示
  }
}

async function confirmPublish(row: ProductItem): Promise<void> {
  try {
    await ElMessageBox.confirm(`确认上架商品「${row.name}」？`, '上架确认', {
      type: 'success',
      confirmButtonText: '确定',
      cancelButtonText: '取消',
    })
  } catch {
    return
  }
  try {
    await productApi.publish(row.id)
    ElMessage.success('上架成功')
    await loadPage()
  } catch {
    // 错误由拦截器提示
  }
}

async function confirmUnpublish(row: ProductItem): Promise<void> {
  try {
    await ElMessageBox.confirm(`确认下架商品「${row.name}」？`, '下架确认', {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消',
    })
  } catch {
    return
  }
  try {
    await productApi.unpublish(row.id)
    ElMessage.success('已下架')
    await loadPage()
  } catch {
    // 错误由拦截器提示
  }
}

function statusLabel(s: ProductStatus): string {
  return ({ DRAFT: '草稿', ON_SALE: '已上架', OFF_SALE: '已下架', DISABLED: '已禁用' } as const)[s]
}

function statusTagType(s: ProductStatus): 'success' | 'info' | 'warning' | 'danger' {
  return ({
    DRAFT: 'info',
    ON_SALE: 'success',
    OFF_SALE: 'warning',
    DISABLED: 'danger',
  } as const)[s]
}

onMounted(() => {
  void loadOptions()
  void loadPage()
})
</script>

<style scoped>
.product-page__toolbar {
  background: var(--admin-bg);
  border: 1px solid var(--admin-border-light);
  border-radius: var(--admin-radius-lg);
  padding: var(--admin-space-3) var(--admin-space-4);
}

.product-page__filter {
  display: flex;
  flex-wrap: wrap;
  gap: 0;
  margin: 0;
}

.product-page__card {
  overflow: hidden;
}

.product-page__toolbar-inner {
  padding: var(--admin-space-3) var(--admin-space-4);
  margin-bottom: 0;
  border-bottom: 1px solid var(--admin-border-light);
}

.product-page__table {
  width: 100%;
}

.product-page__empty {
  padding: var(--admin-space-6);
  color: var(--admin-text-tertiary);
  font-size: 13px;
  text-align: center;
}

.thumb {
  width: 48px;
  height: 48px;
  border-radius: var(--admin-radius-sm);
  border: 1px solid var(--admin-border-light);
}

.thumb-fallback {
  font-size: 20px;
  color: var(--admin-text-placeholder);
}

.thumb-empty {
  color: var(--admin-text-placeholder);
}
</style>
