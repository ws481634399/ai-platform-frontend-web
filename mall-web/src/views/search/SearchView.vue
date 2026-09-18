<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { ProductSearchSort } from '@/api/search'
import { catalogApi, type BrandView, type CategoryNode } from '@/api/catalog'
import { useSearchStore } from '@/stores/search'
import { useFeaturesStore } from '@/stores/features'
import StateView from '@/components/StateView.vue'
import PriceText from '@/components/PriceText.vue'

/**
 * 商品搜索结果页（CHG-0020 FE-501）。
 *
 * - 路由 /search，route.query 为查询条件唯一状态源（keyword/categoryId/brandId/
 *   minPriceFen/maxPriceFen/sort/page/size），控件变更统一 router.replace；
 * - watch route.query 自动重新搜索（竞态防护在 search store 内）；
 * - FE-504：search.enabled=false 时不发请求，仅展示「暂未开放」空态；
 * - 无任何搜索条件时展示热门搜索引导，而非空结果/报错。
 */
const route = useRoute()
const router = useRouter()
const searchStore = useSearchStore()
const features = useFeaturesStore()

/** 热门搜索词（无关键词时引导，点击即搜） */
const HOT_KEYWORDS = ['手机', '机械键盘', '蓝牙耳机', '笔记本电脑']

const SORT_TABS: { key: ProductSearchSort; label: string }[] = [
  { key: '', label: '综合' },
  { key: 'price_asc', label: '价格升' },
  { key: 'price_desc', label: '价格降' },
  { key: 'newest', label: '最新' },
]
const VALID_SORTS: ProductSearchSort[] = ['', 'price_asc', 'price_desc', 'newest']

const DEFAULT_SIZE = 20

const searchEnabled = computed(() => features.hasFeature('search.enabled', true))

/**
 * 分类/品牌筛选项（CHG-0020 AC-015）：挂载时复用公开分类树/品牌分页接口加载。
 * 分类树拍平为带层级缩进的选项；加载失败静默（筛选项不渲染，关键词/价区仍可用）。
 */
interface FilterOption {
  value: string
  label: string
}
const categoryOptions = ref<FilterOption[]>([])
const brandOptions = ref<FilterOption[]>([])

function flattenCategories(nodes: CategoryNode[], depth: number, acc: FilterOption[]): void {
  for (const node of nodes) {
    acc.push({ value: node.id, label: `${'　'.repeat(depth)}${node.name}` })
    if (node.children?.length) flattenCategories(node.children, depth + 1, acc)
  }
}

onMounted(async () => {
  try {
    const [tree, brandPage] = await Promise.all([
      catalogApi.getCategoriesTree(),
      catalogApi.getBrands(1, 200),
    ])
    const flat: FilterOption[] = []
    flattenCategories(tree, 0, flat)
    categoryOptions.value = flat
    brandOptions.value = brandPage.items.map((b: BrandView) => ({ value: b.id, label: b.name }))
  } catch {
    // 筛选元数据加载失败不阻塞搜索：静默降级为无下拉筛选
    categoryOptions.value = []
    brandOptions.value = []
  }
})

/** 切换分类/品牌筛选：变更后回到第 1 页；选"全部"清除该条件 */
function setFilter(key: 'categoryId' | 'brandId', value: string) {
  router.replace({ name: 'search', query: buildRouterQuery({ [key]: value, page: '' }) })
}

// 搜索框 / 价格区间为本地输入态，提交时才写入 URL，并随 URL 变化回填
const keywordInput = ref('')
const minYuan = ref('')
const maxYuan = ref('')
const priceError = ref('')

function parseOptionalInt(value: unknown): number | undefined {
  if (value == null || value === '') return undefined
  const n = Number.parseInt(String(value), 10)
  return Number.isFinite(n) ? n : undefined
}

function parsePositiveInt(value: unknown, fallback: number): number {
  const n = parseOptionalInt(value)
  return n != null && n > 0 ? n : fallback
}

/**
 * 业务 ID（雪花 long）从 URL query 解析：仅接受纯数字串原样保留（保精度）；
 * 空值/非法值（如手改 URL 垃圾字符）回退 undefined，由后端参数校验兜底。
 */
function parseId(value: unknown): string | undefined {
  if (value == null) return undefined
  const s = String(value).trim()
  return /^\d+$/.test(s) ? s : undefined
}

/** 从 route.query 解析搜索参数（非法值回退默认，与 ProductListView 同范式） */
function parseRouteQuery() {
  const q = route.query
  const sortRaw = q.sort ? String(q.sort) : ''
  return {
    keyword: q.keyword ? String(q.keyword).trim() : '',
    categoryId: parseId(q.categoryId),
    brandId: parseId(q.brandId),
    minPriceFen: parseOptionalInt(q.minPriceFen),
    maxPriceFen: parseOptionalInt(q.maxPriceFen),
    sort: (VALID_SORTS.includes(sortRaw as ProductSearchSort) ? sortRaw : '') as ProductSearchSort,
    page: parsePositiveInt(q.page, 1),
    size: parsePositiveInt(q.size, DEFAULT_SIZE),
  }
}

const currentQuery = computed(parseRouteQuery)

/** 是否存在任一搜索条件（无关键词且无筛选时给引导，不发请求） */
const hasCriteria = computed(
  () =>
    !!currentQuery.value.keyword ||
    currentQuery.value.categoryId != null ||
    currentQuery.value.brandId != null ||
    currentQuery.value.minPriceFen != null ||
    currentQuery.value.maxPriceFen != null,
)

const totalPages = computed(() =>
  Math.max(1, Math.ceil(searchStore.total / (currentQuery.value.size || DEFAULT_SIZE))),
)

/** 整数分 → 元输入框回填（如 9900 → "99"、9999 → "99.99"） */
function yuanFromFen(fen: unknown): string {
  const n = parseOptionalInt(fen)
  if (n == null) return ''
  return String(n / 100)
}

/** URL 变化 → 回填搜索框/价格输入（不清用户正在输入但未提交的内容仅发生于路由变更时，可接受） */
watch(
  () => route.query,
  (q) => {
    keywordInput.value = q.keyword ? String(q.keyword) : ''
    minYuan.value = yuanFromFen(q.minPriceFen)
    maxYuan.value = yuanFromFen(q.maxPriceFen)
    priceError.value = ''
  },
  { immediate: true },
)

/** 将当前解析后的查询序列化为 router query（空值省略，第 1 页不带 page） */
function buildRouterQuery(
  override: Partial<Record<'keyword' | 'categoryId' | 'brandId' | 'minPriceFen' | 'maxPriceFen' | 'sort' | 'page', string>>,
): Record<string, string> {
  const cur = parseRouteQuery()
  const next: Record<string, string> = {}
  if (cur.keyword) next.keyword = cur.keyword
  if (cur.categoryId != null) next.categoryId = String(cur.categoryId)
  if (cur.brandId != null) next.brandId = String(cur.brandId)
  if (cur.minPriceFen != null) next.minPriceFen = String(cur.minPriceFen)
  if (cur.maxPriceFen != null) next.maxPriceFen = String(cur.maxPriceFen)
  if (cur.sort) next.sort = cur.sort
  if (cur.page > 1) next.page = String(cur.page)
  if (cur.size !== DEFAULT_SIZE) next.size = String(cur.size)
  for (const [k, v] of Object.entries(override)) {
    if (v == null || v === '') delete next[k]
    else next[k] = v
  }
  return next
}

/** 提交关键词（回车/按钮），重置到第 1 页 */
function submitKeyword() {
  const k = keywordInput.value.trim()
  router.replace({ name: 'search', query: buildRouterQuery({ keyword: k, page: '' }) })
}

/** 热门词快捷搜索 */
function searchHotKeyword(k: string) {
  keywordInput.value = k
  router.replace({ name: 'search', query: buildRouterQuery({ keyword: k, page: '' }) })
}

/** 切换排序 tab */
function setSort(sort: ProductSearchSort) {
  router.replace({ name: 'search', query: buildRouterQuery({ sort, page: '' }) })
}

/** 元 → 整数分（Math.round 消除浮点误差）；非法返回 undefined */
function yuanToFen(value: string): number | undefined {
  const trimmed = value.trim()
  if (!trimmed) return undefined
  const yuan = Number(trimmed)
  if (!Number.isFinite(yuan) || yuan < 0) return undefined
  return Math.round(yuan * 100)
}

/** 提交价格区间；区间倒置/非法时仅提示，不改 URL、不发请求 */
function submitPrice() {
  const min = yuanToFen(minYuan.value)
  const max = yuanToFen(maxYuan.value)
  if ((minYuan.value.trim() && min == null) || (maxYuan.value.trim() && max == null)) {
    priceError.value = '请输入正确的价格'
    return
  }
  if (min != null && max != null && min > max) {
    priceError.value = '最低价格不能高于最高价格'
    return
  }
  router.replace({
    name: 'search',
    query: buildRouterQuery({
      minPriceFen: min?.toString() ?? '',
      maxPriceFen: max?.toString() ?? '',
      page: '',
    }),
  })
}

function goPage(page: number) {
  router.replace({ name: 'search', query: buildRouterQuery({ page: page > 1 ? String(page) : '' }) })
}

async function retry() {
  if (!searchEnabled.value || !hasCriteria.value) return
  await searchStore.search(currentQuery.value)
}

// route.query 变化 → 自动重新搜索（关闭态/无条件不发请求）
watch(
  () => route.fullPath,
  async () => {
    if (!searchEnabled.value || !hasCriteria.value) return
    await searchStore.search(currentQuery.value)
  },
  { immediate: true },
)

function onCardClick(productId: string) {
  void router.push(`/products/${productId}`)
}
</script>

<template>
  <div class="search-view">
    <!-- FE-504 关闭态：不发任何搜索请求，友好空态（不裸露 403） -->
    <StateView
      v-if="!searchEnabled"
      :loading="false"
      :is-empty="true"
    >
      <template #empty>
        <div
          class="search-view__closed"
          data-testid="search-closed"
        >
          <p class="search-view__closed-title">
            搜索功能暂未开放
          </p>
          <p class="search-view__closed-text">
            该功能正在升级中，您可以先浏览商品分类。
          </p>
          <router-link
            to="/products"
            class="search-view__closed-action"
          >
            去逛逛商品
          </router-link>
        </div>
      </template>
    </StateView>

    <template v-else>
      <!-- 顶部搜索框：回填 route.query.keyword，回车/按钮触发 -->
      <form
        class="search-view__bar"
        data-testid="search-form"
        @submit.prevent="submitKeyword"
      >
        <input
          v-model="keywordInput"
          type="search"
          class="search-view__input"
          placeholder="搜索商品 / 品牌 / 分类"
          aria-label="搜索商品"
          data-testid="search-input"
        >
        <button
          type="submit"
          class="search-view__submit"
          data-testid="search-submit"
        >
          搜索
        </button>
      </form>

      <!-- 无关键词且无筛选：热门搜索引导（非报错） -->
      <div
        v-if="!hasCriteria"
        class="search-view__guide"
        data-testid="search-guide"
      >
        <h2 class="search-view__guide-title">
          搜索你想要的商品
        </h2>
        <p class="search-view__guide-text">
          输入关键词，或试试大家都在搜：
        </p>
        <div class="search-view__hot">
          <button
            v-for="k in HOT_KEYWORDS"
            :key="k"
            type="button"
            class="search-view__hot-chip"
            :data-testid="`search-hot-${k}`"
            @click="searchHotKeyword(k)"
          >
            {{ k }}
          </button>
        </div>
      </div>

      <template v-else>
        <!-- 分类/品牌筛选（AC-015）：变更写入 URL 并回到第 1 页 -->
        <div
          v-if="categoryOptions.length || brandOptions.length"
          class="search-view__filters"
          data-testid="search-filters"
        >
          <select
            v-if="categoryOptions.length"
            class="search-view__filter-select"
            aria-label="按分类筛选"
            data-testid="search-filter-category"
            :value="currentQuery.categoryId ?? ''"
            @change="setFilter('categoryId', ($event.target as HTMLSelectElement).value)"
          >
            <option value="">
              全部分类
            </option>
            <option
              v-for="opt in categoryOptions"
              :key="opt.value"
              :value="opt.value"
            >
              {{ opt.label }}
            </option>
          </select>
          <select
            v-if="brandOptions.length"
            class="search-view__filter-select"
            aria-label="按品牌筛选"
            data-testid="search-filter-brand"
            :value="currentQuery.brandId ?? ''"
            @change="setFilter('brandId', ($event.target as HTMLSelectElement).value)"
          >
            <option value="">
              全部品牌
            </option>
            <option
              v-for="opt in brandOptions"
              :key="opt.value"
              :value="opt.value"
            >
              {{ opt.label }}
            </option>
          </select>
        </div>

        <!-- 排序 tab + 价格区间 -->
        <div class="search-view__toolbar">
          <div
            class="search-view__sortbar"
            role="tablist"
            aria-label="搜索排序"
          >
            <button
              v-for="tab in SORT_TABS"
              :key="tab.key || 'default'"
              type="button"
              class="search-view__sort-btn"
              :class="{ active: currentQuery.sort === tab.key }"
              :data-testid="`search-sort-${tab.key || 'default'}`"
              @click="setSort(tab.key)"
            >
              {{ tab.label }}
            </button>
          </div>

          <form
            class="search-view__price"
            data-testid="search-price-form"
            @submit.prevent="submitPrice"
          >
            <input
              v-model="minYuan"
              type="number"
              min="0"
              step="0.01"
              class="search-view__price-input"
              placeholder="最低价（元）"
              aria-label="最低价（元）"
              data-testid="search-price-min"
            >
            <span class="search-view__price-sep">–</span>
            <input
              v-model="maxYuan"
              type="number"
              min="0"
              step="0.01"
              class="search-view__price-input"
              placeholder="最高价（元）"
              aria-label="最高价（元）"
              data-testid="search-price-max"
            >
            <button
              type="submit"
              class="search-view__price-btn"
              data-testid="search-price-submit"
            >
              确定
            </button>
          </form>
        </div>
        <p
          v-if="priceError"
          class="search-view__price-error"
          data-testid="search-price-error"
        >
          {{ priceError }}
        </p>

        <StateView
          :loading="searchStore.loading"
          :error="searchStore.error"
          :is-empty="searchStore.items.length === 0"
          @retry="retry"
        >
          <template #empty>
            <div
              class="search-view__empty"
              data-testid="search-empty"
            >
              <p class="search-view__empty-text">
                没有找到
                <template v-if="currentQuery.keyword">「{{ currentQuery.keyword }}」</template>
                相关的商品
              </p>
              <p class="search-view__empty-hint">
                换个关键词，或放宽筛选条件试试
              </p>
            </div>
          </template>

          <template #default>
            <div
              class="search-view__meta"
              data-testid="search-meta"
            >
              共 <span class="search-view__meta-total">{{ searchStore.total }}</span> 件相关商品
            </div>
            <div
              class="search-view__grid"
              data-testid="search-grid"
            >
              <article
                v-for="item in searchStore.items"
                :key="item.productId"
                class="search-card"
                :data-testid="`search-card-${item.productId}`"
                tabindex="0"
                @click="onCardClick(item.productId)"
                @keydown.enter.prevent="onCardClick(item.productId)"
              >
                <div class="search-card__media">
                  <img
                    v-if="item.mainImage"
                    :src="item.mainImage"
                    :alt="item.productName"
                    loading="lazy"
                    class="search-card__img"
                  >
                  <div
                    v-else
                    class="search-card__img search-card__img--placeholder"
                  >
                    <span>暂无图片</span>
                  </div>
                </div>
                <div class="search-card__body">
                  <h3 class="search-card__name">
                    {{ item.productName }}
                  </h3>
                  <p
                    v-if="item.brandName || item.categoryName"
                    class="search-card__tags"
                  >
                    <template v-if="item.brandName">{{ item.brandName }}</template>
                    <template v-if="item.brandName && item.categoryName"> · </template>
                    <template v-if="item.categoryName">{{ item.categoryName }}</template>
                  </p>
                  <div class="search-card__price">
                    <PriceText :value="item.minPrice" />
                    <template v-if="item.maxPrice && item.maxPrice !== item.minPrice">
                      <span class="search-card__price-sep">–</span>
                      <PriceText :value="item.maxPrice" />
                    </template>
                  </div>
                </div>
              </article>
            </div>

            <div
              v-if="totalPages > 1"
              class="search-view__pager"
              data-testid="search-pager"
            >
              <button
                type="button"
                class="search-view__pager-btn"
                :disabled="currentQuery.page <= 1"
                @click="goPage(currentQuery.page - 1)"
              >
                上一页
              </button>
              <span class="search-view__pager-info">
                <span class="search-view__pager-current">{{ currentQuery.page }}</span>
                <span class="search-view__pager-sep">/</span>
                <span>{{ totalPages }}</span>
              </span>
              <button
                type="button"
                class="search-view__pager-btn"
                :disabled="currentQuery.page >= totalPages"
                @click="goPage(currentQuery.page + 1)"
              >
                下一页
              </button>
            </div>
          </template>
        </StateView>
      </template>
    </template>
  </div>
</template>

<style scoped>
.search-view {
  max-width: var(--content-max-width);
  margin: 0 auto;
}

/* ── 顶部搜索框 ─────────────────────────── */
.search-view__bar {
  display: flex;
  max-width: 640px;
  margin: 0 auto var(--space-6);
  height: 42px;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-pill);
  background: var(--color-bg);
  overflow: hidden;
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}
.search-view__bar:focus-within {
  border-color: var(--color-border-focus);
  box-shadow: var(--shadow-focus);
}
.search-view__input {
  flex: 1;
  min-width: 0;
  padding: 0 var(--space-5);
  border: none;
  background: transparent;
  font-size: var(--text-base);
  color: var(--color-text);
}
.search-view__input:focus {
  outline: none;
}
.search-view__input::placeholder {
  color: var(--color-text-muted);
}
.search-view__submit {
  flex-shrink: 0;
  padding: 0 var(--space-8);
  border: none;
  background: var(--color-primary);
  color: var(--color-text-on-primary);
  font-size: var(--text-md);
  font-weight: 500;
  cursor: pointer;
  transition: background var(--transition-fast);
}
.search-view__submit:hover {
  background: var(--color-primary-hover);
}

/* ── 热门搜索引导 ───────────────────────── */
.search-view__guide {
  text-align: center;
  padding: var(--space-12) var(--space-4);
}
.search-view__guide-title {
  margin: 0 0 var(--space-2);
  font-size: var(--text-xl);
  font-weight: 600;
  color: var(--color-text);
}
.search-view__guide-text {
  margin: 0 0 var(--space-5);
  font-size: var(--text-sm);
  color: var(--color-text-tertiary);
}
.search-view__hot {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--space-3);
}
.search-view__hot-chip {
  padding: var(--space-2) var(--space-5);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-pill);
  background: var(--color-bg);
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}
.search-view__hot-chip:hover {
  border-color: var(--color-border-focus);
  color: var(--color-text);
}

/* ── 分类/品牌筛选条 ─────────────────────── */
.search-view__filters {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
  flex-wrap: wrap;
}
.search-view__filter-select {
  min-width: 160px;
  max-width: 280px;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
  background: var(--color-bg);
  font-size: var(--text-sm);
  color: var(--color-text);
  cursor: pointer;
}
.search-view__filter-select:focus {
  outline: none;
  border-color: var(--color-border-focus);
}

/* ── 工具条：排序 + 价区 ────────────────── */
.search-view__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: var(--space-4);
  flex-wrap: wrap;
}
.search-view__sortbar {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-2);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-pill);
}
.search-view__sort-btn {
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
.search-view__sort-btn:hover {
  color: var(--color-text);
  background: var(--color-bg-muted);
}
.search-view__sort-btn.active {
  background: var(--color-primary);
  color: var(--color-text-on-primary);
}

.search-view__price {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}
.search-view__price-input {
  width: 108px;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
  background: var(--color-bg);
  font-size: var(--text-sm);
  color: var(--color-text);
}
.search-view__price-input:focus {
  outline: none;
  border-color: var(--color-border-focus);
}
.search-view__price-sep {
  color: var(--color-text-muted);
}
.search-view__price-btn {
  padding: var(--space-2) var(--space-4);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
  background: var(--color-bg);
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}
.search-view__price-btn:hover {
  border-color: var(--color-border-focus);
  color: var(--color-text);
}
.search-view__price-error {
  margin: 0 0 var(--space-3);
  font-size: var(--text-sm);
  color: var(--color-danger);
}

/* ── 结果元信息 ─────────────────────────── */
.search-view__meta {
  margin-bottom: var(--space-3);
  font-size: var(--text-sm);
  color: var(--color-text-tertiary);
}
.search-view__meta-total {
  color: var(--color-text);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

/* ── 结果网格 / 卡片（视觉风格对齐 ProductCard） ── */
.search-view__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--space-4);
}

.search-card {
  position: relative;
  display: flex;
  flex-direction: column;
  background: var(--color-bg);
  border-radius: var(--radius-lg);
  overflow: hidden;
  cursor: pointer;
  outline: none;
  transition: box-shadow var(--transition), transform var(--transition);
}
.search-card:hover,
.search-card:focus-visible {
  box-shadow: var(--shadow-md);
}
.search-card:focus-visible {
  outline: 2px solid var(--color-border-focus);
  outline-offset: 2px;
}
.search-card__media {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  background: var(--color-bg-muted);
  overflow: hidden;
}
.search-card__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--transition-slow);
}
.search-card:hover .search-card__img {
  transform: scale(1.02);
}
.search-card__img--placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
  font-size: var(--text-sm);
  background-image:
    linear-gradient(45deg, var(--color-border) 25%, transparent 25%, transparent 75%, var(--color-border) 75%),
    linear-gradient(45deg, var(--color-border) 25%, transparent 25%, transparent 75%, var(--color-border) 75%);
  background-size: 20px 20px;
  background-position: 0 0, 10px 10px;
}
.search-card__body {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-3) var(--space-4);
}
.search-card__name {
  margin: 0;
  font-size: var(--text-base);
  font-weight: 500;
  line-height: var(--leading-tight);
  color: var(--color-text);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: calc(2em * var(--leading-tight));
}
.search-card__tags {
  margin: 0;
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.search-card__price {
  display: flex;
  align-items: baseline;
  gap: var(--space-1);
  font-size: var(--text-md);
  color: var(--color-price);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
.search-card__price-sep {
  color: var(--color-text-muted);
  margin: 0 var(--space-1);
}

/* ── 空态 / 关闭态 ──────────────────────── */
.search-view__empty,
.search-view__closed {
  text-align: center;
  padding: var(--space-12) var(--space-4);
  color: var(--color-text-tertiary);
}
.search-view__empty-text {
  margin: 0 0 var(--space-2);
  font-size: var(--text-base);
}
.search-view__empty-hint {
  margin: 0;
  font-size: var(--text-sm);
}
.search-view__closed-title {
  margin: 0 0 var(--space-2);
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--color-text);
}
.search-view__closed-text {
  margin: 0 0 var(--space-4);
  font-size: var(--text-sm);
}
.search-view__closed-action {
  display: inline-block;
  padding: var(--space-2) var(--space-5);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
  transition: all var(--transition-fast);
}
.search-view__closed-action:hover {
  border-color: var(--color-border-focus);
  color: var(--color-text);
}

/* ── 分页（范式同 ProductListView） ─────── */
.search-view__pager {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--space-3);
  margin-top: var(--space-6);
  padding: var(--space-4) 0;
}
.search-view__pager-btn {
  padding: var(--space-2) var(--space-4);
  border: 1px solid var(--color-border);
  background: var(--color-bg);
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  transition: all var(--transition-fast);
}
.search-view__pager-btn:hover:not(:disabled) {
  border-color: var(--color-border-strong);
  color: var(--color-text);
}
.search-view__pager-btn:disabled {
  color: var(--color-text-muted);
  cursor: not-allowed;
}
.search-view__pager-info {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  font-variant-numeric: tabular-nums;
}
.search-view__pager-current {
  color: var(--color-text);
  font-weight: 600;
}
.search-view__pager-sep {
  color: var(--color-text-muted);
  margin: 0 var(--space-1);
}

/* ── 响应式：移动端两列 ────────────────── */
@media (max-width: 768px) {
  .search-view__toolbar {
    flex-direction: column;
    align-items: stretch;
  }
  .search-view__price {
    justify-content: space-between;
  }
  .search-view__price-input {
    flex: 1;
    width: auto;
  }
  .search-view__grid {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-3);
  }
}
</style>
