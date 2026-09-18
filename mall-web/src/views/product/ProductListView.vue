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

const SORT_LABELS: Record<SortKey, string> = {
  default: '综合',
  newest: '新品',
  price_asc: '价格升序',
  price_desc: '价格降序',
}

const loading = ref(true)
const filterOpen = ref(false)
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
    <!-- 移动端筛选抽屉触发器 -->
    <button
      type="button"
      class="product-list__filter-toggle"
      data-testid="filter-toggle"
      @click="filterOpen = !filterOpen"
    >
      筛选
    </button>

    <aside
      class="product-list__sidebar"
      :class="{ 'product-list__sidebar--open': filterOpen }"
      aria-label="商品筛选"
    >
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

      <div
        v-if="brands.length"
        class="product-list__filter-group"
      >
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
          <span class="product-list__brand-name">{{ b.name }}</span>
        </label>
      </div>
    </aside>

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
          {{ SORT_LABELS[s] }}
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
            <p class="product-list__empty-text">
              没有符合条件的商品
            </p>
            <button
              type="button"
              class="product-list__empty-action"
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
            class="product-list__pager-btn"
            :disabled="(currentQuery.page || 1) <= 1"
            @click="goPage((currentQuery.page || 1) - 1)"
          >
            上一页
          </button>
          <span class="product-list__pager-info">
            <span class="product-list__pager-current">{{ currentQuery.page || 1 }}</span>
            <span class="product-list__pager-sep">/</span>
            <span>{{ totalPages }}</span>
          </span>
          <button
            type="button"
            class="product-list__pager-btn"
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
  gap: var(--space-6);
  max-width: var(--content-max-width);
  margin: 0 auto;
}

/* ── Sidebar ──────────────────────────── */
.product-list__sidebar {
  width: 200px;
  flex-shrink: 0;
  position: sticky;
  top: calc(var(--header-height) + var(--space-6));
  align-self: flex-start;
  max-height: calc(100vh - var(--header-height) - var(--space-6));
  overflow-y: auto;
  padding-right: var(--space-3);
}

.product-list__filter-group {
  margin-bottom: var(--space-6);
}
.product-list__filter-group:last-child {
  margin-bottom: 0;
}

.product-list__filter-title {
  margin: 0 0 var(--space-2);
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--color-text-tertiary);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.product-list__filter-item {
  display: block;
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border: none;
  background: transparent;
  text-align: left;
  cursor: pointer;
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  border-radius: var(--radius-md);
  transition: background var(--transition-fast), color var(--transition-fast);
}
.product-list__filter-item:hover {
  background: var(--color-bg-muted);
  color: var(--color-text);
}
.product-list__filter-item.active {
  background: var(--color-primary);
  color: var(--color-text-on-primary);
  font-weight: 500;
}

.product-list__brand {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-1) var(--space-3);
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: background var(--transition-fast);
}
.product-list__brand:hover {
  background: var(--color-bg-muted);
}
.product-list__brand input {
  margin: 0;
  accent-color: var(--color-primary);
}
.product-list__brand-name {
  flex: 1;
}

/* ── Main ─────────────────────────────── */
.product-list__main {
  flex: 1;
  min-width: 0;
}

.product-list__sortbar {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  margin-bottom: var(--space-4);
  padding: var(--space-2);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-pill);
}

.product-list__sort-btn {
  padding: var(--space-2) var(--space-4);
  border: none;
  background: transparent;
  border-radius: var(--radius-pill);
  cursor: pointer;
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  font-weight: 500;
  transition: all var(--transition-fast);
}
.product-list__sort-btn:hover {
  color: var(--color-text);
  background: var(--color-bg-muted);
}
.product-list__sort-btn.active {
  background: var(--color-primary);
  color: var(--color-text-on-primary);
}

.product-list__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--space-4);
}

.product-list__empty {
  text-align: center;
  padding: var(--space-12) var(--space-4);
  color: var(--color-text-tertiary);
}
.product-list__empty-text {
  margin: 0 0 var(--space-3);
  font-size: var(--text-base);
}
.product-list__empty-action {
  padding: var(--space-2) var(--space-4);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
  background: var(--color-bg);
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}
.product-list__empty-action:hover {
  border-color: var(--color-border-focus);
  color: var(--color-text);
}

/* ── Pager ───────────────────────────── */
.product-list__pager {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--space-3);
  margin-top: var(--space-6);
  padding: var(--space-4) 0;
}
.product-list__pager-btn {
  padding: var(--space-2) var(--space-4);
  border: 1px solid var(--color-border);
  background: var(--color-bg);
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  transition: all var(--transition-fast);
}
.product-list__pager-btn:hover:not(:disabled) {
  border-color: var(--color-border-strong);
  color: var(--color-text);
}
.product-list__pager-btn:disabled {
  color: var(--color-text-muted);
  cursor: not-allowed;
}
.product-list__pager-info {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  font-variant-numeric: tabular-nums;
}
.product-list__pager-current {
  color: var(--color-text);
  font-weight: 600;
}
.product-list__pager-sep {
  color: var(--color-text-muted);
  margin: 0 var(--space-1);
}

/* 移动端筛选触发器（默认隐藏） */
.product-list__filter-toggle {
  display: none;
}

/* ── 响应式：移动端折叠 sidebar ──────── */
@media (max-width: 768px) {
  .product-list {
    flex-direction: column;
    gap: var(--space-4);
  }
  .product-list__filter-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-2) var(--space-4);
    border: 1px solid var(--color-border);
    background: var(--color-bg);
    border-radius: var(--radius-md);
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    cursor: pointer;
  }
  .product-list__sidebar {
    position: static;
    width: 100%;
    max-height: 0;
    overflow: hidden;
    transition: max-height var(--transition-slow);
    padding-right: 0;
  }
  .product-list__sidebar--open {
    max-height: 600px;
    overflow-y: auto;
    padding: var(--space-4) 0;
  }
  .product-list__grid {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-3);
  }
  .product-list__sortbar {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
}
</style>
