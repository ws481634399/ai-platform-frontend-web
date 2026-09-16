<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { catalogApi, type CategoryNode, type ProductListItem, type ProductListQuery } from '@/api/catalog'
import { resolveErrorMessage } from '@/utils/http-error'
import StateView from '@/components/StateView.vue'
import ProductCard from '@/components/ProductCard.vue'

const route = useRoute()
const router = useRouter()

const VALID_SORTS = ['default', 'newest', 'price_asc', 'price_desc'] as const
type SortKey = (typeof VALID_SORTS)[number]

const loading = ref(true)
const error = ref('')
const products = ref<ProductListItem[]>([])
const total = ref(0)
const categories = ref<CategoryNode[]>([])
const brands = ref<{ id: string; name: string }[]>([])

/** 自增请求序号，防竞态：仅最后一次响应落库 */
let requestSeq = 0

/** 从 route.query 解析查询参数（唯一状态源） */
function parseQuery(): ProductListQuery {
  const q = route.query
  const page = q.page ? parseInt(String(q.page), 10) : 1
  const size = q.size ? parseInt(String(q.size), 10) : 20
  const brandIds = q.brandIds ? String(q.brandIds).split(',').filter(Boolean) : undefined
  const sort = q.sort && VALID_SORTS.includes(q.sort as SortKey) ? String(q.sort) : undefined
  return {
    keyword: q.keyword ? String(q.keyword) : undefined,
    categoryId: q.categoryId ? String(q.categoryId) : undefined,
    brandIds,
    sort,
    page: Number.isFinite(page) && page > 0 ? page : 1,
    size: Number.isFinite(size) && size > 0 ? size : 20,
  }
}

/** 筛选变更 → replace query（重置 page=1） */
function updateQuery(patch: Partial<ProductListQuery>, resetPage = true) {
  const current = parseQuery()
  const next: ProductListQuery = { ...current, ...patch }
  if (resetPage) next.page = 1
  router.replace({ query: serializeForRouter(next) })
}

function serializeForRouter(q: ProductListQuery): Record<string, string> {
  const params: Record<string, string> = {}
  if (q.keyword) params.keyword = q.keyword
  if (q.categoryId) params.categoryId = q.categoryId
  if (q.brandIds && q.brandIds.length) params.brandIds = q.brandIds.join(',')
  if (q.sort) params.sort = q.sort
  if (q.page && q.page > 1) params.page = String(q.page)
  if (q.size && q.size !== 20) params.size = String(q.size)
  return params
}

const currentQuery = computed(parseQuery)
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / (currentQuery.value.size || 20))))

function toggleBrand(brandId: string) {
  const ids = currentQuery.value.brandIds ? [...currentQuery.value.brandIds] : []
  const idx = ids.indexOf(brandId)
  if (idx >= 0) ids.splice(idx, 1)
  else ids.push(brandId)
  updateQuery({ brandIds: ids.length ? ids : undefined })
}

function setSort(sort: string) {
  updateQuery({ sort })
}

function setCategory(categoryId: string | undefined) {
  updateQuery({ categoryId })
}

function goPage(page: number) {
  updateQuery({ page }, false)
}

async function loadProducts() {
  const seq = ++requestSeq
  loading.value = true
  error.value = ''
  try {
    const result = await catalogApi.getProducts(currentQuery.value)
    if (seq !== requestSeq) return // 竞态：丢弃旧响应
    products.value = result.records
    total.value = result.total
  } catch (e) {
    if (seq !== requestSeq) return
    error.value = resolveErrorMessage(e, '商品列表加载失败，请稍后重试')
    products.value = []
    total.value = 0
  } finally {
    if (seq === requestSeq) loading.value = false
  }
}

onMounted(async () => {
  try {
    const [cats, brs] = await Promise.all([catalogApi.getCategoriesTree(), catalogApi.getBrands(1, 200)])
    categories.value = cats
    brands.value = brs.items.map((b) => ({ id: b.id, name: b.name }))
  } catch {
    /* 分类/品牌加载失败不阻断商品列表 */
  }
  loadProducts()
})

// route.query 变化 → 重新加载（唯一状态源驱动）
watch(
  () => route.fullPath,
  () => {
    if (categories.value.length > 0) loadProducts()
  },
)
</script>

<template>
  <div class="product-list">
    <div class="product-list__sidebar">
      <div class="product-list__filter-group">
        <h3 class="product-list__filter-title">
          分类
        </h3>
        <button
          type="button"
          class="product-list__filter-item"
          :class="{ active: !currentQuery.categoryId }"
          data-testid="category-all"
          @click="setCategory(undefined)"
        >
          全部
        </button>
        <template
          v-for="cat in categories"
          :key="cat.id"
        >
          <button
            type="button"
            class="product-list__filter-item"
            :class="{ active: currentQuery.categoryId === cat.id }"
            :data-testid="`category-${cat.id}`"
            @click="setCategory(cat.id)"
          >
            {{ cat.name }}
          </button>
        </template>
      </div>

      <div class="product-list__filter-group">
        <h3 class="product-list__filter-title">
          品牌
        </h3>
        <label
          v-for="b in brands"
          :key="b.id"
          class="product-list__brand"
        >
          <input
            type="checkbox"
            :value="b.id"
            :checked="currentQuery.brandIds?.includes(b.id)"
            :data-testid="`brand-${b.id}`"
            @change="toggleBrand(b.id)"
          >
          {{ b.name }}
        </label>
      </div>
    </div>

    <div class="product-list__main">
      <div class="product-list__sortbar">
        <button
          v-for="s in VALID_SORTS"
          :key="s"
          type="button"
          class="product-list__sort-btn"
          :class="{ active: (currentQuery.sort || 'default') === s }"
          :data-testid="`sort-${s}`"
          @click="setSort(s)"
        >
          {{ s === 'default' ? '默认' : s === 'newest' ? '新品' : s === 'price_asc' ? '价格升' : '价格降' }}
        </button>
      </div>

      <StateView
        :loading="loading"
        :error="error"
        :is-empty="products.length === 0"
        @retry="loadProducts"
      >
        <template #empty>
          <div
            class="product-list__empty"
            data-testid="list-empty"
          >
            <p>没有符合条件的商品</p>
            <button
              type="button"
              data-testid="clear-filters"
              @click="router.replace({ query: {} })"
            >
              清空筛选
            </button>
          </div>
        </template>
        <div
          class="product-list__grid"
          data-testid="product-grid"
        >
          <ProductCard
            v-for="p in products"
            :key="p.id"
            :product="{ id: p.id, name: p.productName, mainImageUrl: p.mainImageUrl, minPrice: p.minPrice, maxPrice: p.maxPrice }"
          />
        </div>
        <div
          v-if="totalPages > 1"
          class="product-list__pager"
          data-testid="pager"
        >
          <button
            type="button"
            :disabled="(currentQuery.page || 1) <= 1"
            @click="goPage((currentQuery.page || 1) - 1)"
          >
            上一页
          </button>
          <span>{{ currentQuery.page || 1 }} / {{ totalPages }}</span>
          <button
            type="button"
            :disabled="(currentQuery.page || 1) >= totalPages"
            @click="goPage((currentQuery.page || 1) + 1)"
          >
            下一页
          </button>
        </div>
      </StateView>
    </div>
  </div>
</template>

<style scoped>
.product-list {
  display: flex;
  gap: 16px;
  max-width: 1200px;
  margin: 0 auto;
}

.product-list__sidebar {
  width: 200px;
  flex-shrink: 0;
}

.product-list__filter-group {
  margin-bottom: 16px;
}

.product-list__filter-title {
  margin: 0 0 8px;
  font-size: 14px;
  color: #374151;
}

.product-list__filter-item {
  display: block;
  width: 100%;
  padding: 6px 8px;
  border: none;
  background: transparent;
  text-align: left;
  cursor: pointer;
  font-size: 13px;
  color: #4b5563;
  border-radius: 4px;
}

.product-list__filter-item.active {
  background: #eef2ff;
  color: #4f46e5;
  font-weight: 600;
}

.product-list__brand {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 0;
  font-size: 13px;
  color: #4b5563;
  cursor: pointer;
}

.product-list__main {
  flex: 1;
  min-width: 0;
}

.product-list__sortbar {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.product-list__sort-btn {
  padding: 6px 12px;
  border: 1px solid #e5e7eb;
  background: #fff;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
}

.product-list__sort-btn.active {
  border-color: #4f46e5;
  color: #4f46e5;
}

.product-list__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
}

.product-list__empty {
  text-align: center;
  padding: 32px;
  color: #6b7280;
}

.product-list__pager {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
}

.product-list__pager button {
  padding: 6px 12px;
  cursor: pointer;
}
</style>
