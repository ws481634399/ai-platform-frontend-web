<script setup lang="ts">
import { computed, ref } from 'vue'
import { aiApi, type AiCompareResponse } from '@/api/ai'
import { searchApi, type ProductSearchItem } from '@/api/search'

/**
 * AI 商品对比（CHG-0024 DU-FE-002）。
 *
 * 交互状态机（story-design §4 错误口径）：
 * - 商品选择器（关键词搜索 → 勾选 2~6 个）+ 可选场景问题 → 提交；
 * - 成功 → 维度对比表格（行=维度，列=商品，缺失"暂无该项数据"）+ AI 总结；
 * - 403（开关关闭）→ 空态"AI 对比暂未开启"；5xx/网络 → Error 态可重试（复用上一次请求）。
 */

interface CandidateItem extends ProductSearchItem {
  /** 勾选框展示名（价格为区间，搜索摘要口径） */
  priceHint: string
}

const MIN_PRODUCTS = 2
const MAX_PRODUCTS = 6
const MISSING_CELL = '暂无该项数据'

const searchKeyword = ref('')
const searching = ref(false)
const searched = ref(false)
const candidates = ref<CandidateItem[]>([])
const selectedIds = ref<string[]>([])
const question = ref('')

const loading = ref(false)
const errorState = ref(false)
const disabledState = ref(false)
const result = ref<AiCompareResponse | null>(null)
let lastRequest: { productIds: string[]; question?: string } | null = null

function fenToYuan(fen: number | null): string {
  if (fen === null) return ''
  return (fen / 100).toFixed(2)
}

const selectedProducts = computed(() =>
  selectedIds.value
    .map((id) => candidates.value.find((c) => c.productId === id))
    .filter((c): c is CandidateItem => Boolean(c)),
)

const canSubmit = computed(
  () => selectedIds.value.length >= MIN_PRODUCTS && selectedIds.value.length <= MAX_PRODUCTS && !loading.value,
)

async function searchProducts(): Promise<void> {
  const keyword = searchKeyword.value.trim()
  if (!keyword || searching.value) return
  searching.value = true
  try {
    const page = await searchApi.products({ keyword, page: 1, size: 20 })
    candidates.value = page.items.map((item) => ({
      ...item,
      priceHint:
        item.minPrice === null
          ? '暂无报价'
          : item.maxPrice !== null && item.maxPrice !== item.minPrice
            ? `￥${fenToYuan(item.minPrice)}~￥${fenToYuan(item.maxPrice)}`
            : `￥${fenToYuan(item.minPrice)}`,
    }))
    searched.value = true
  } catch {
    candidates.value = []
    searched.value = true
  } finally {
    searching.value = false
  }
}

function isSelected(productId: string): boolean {
  return selectedIds.value.includes(productId)
}

function toggleSelect(productId: string): void {
  if (isSelected(productId)) {
    selectedIds.value = selectedIds.value.filter((id) => id !== productId)
    return
  }
  if (selectedIds.value.length >= MAX_PRODUCTS) return
  selectedIds.value = [...selectedIds.value, productId]
}

async function submit(): Promise<void> {
  const productIds = [...selectedIds.value]
  if (productIds.length < MIN_PRODUCTS || loading.value) return
  const q = question.value.trim()
  lastRequest = { productIds, question: q || undefined }
  await runCompare(lastRequest)
}

async function runCompare(params: { productIds: string[]; question?: string }): Promise<void> {
  loading.value = true
  errorState.value = false
  disabledState.value = false
  result.value = null
  try {
    result.value = await aiApi.compare(params)
  } catch (error: unknown) {
    const status = (error as { response?: { status?: number } })?.response?.status
    if (status === 403) {
      disabledState.value = true
    } else {
      errorState.value = true
    }
  } finally {
    loading.value = false
  }
}

function retry(): void {
  if (lastRequest) void runCompare(lastRequest)
}

function cellValue(values: Record<string, string>, productId: string): string {
  return values[productId] ?? MISSING_CELL
}
</script>

<template>
  <section class="compare">
    <header class="compare__header">
      <h1 class="compare__title">AI 商品对比</h1>
      <p class="compare__subtitle">选 2~6 件商品，我来帮你逐项对比</p>
    </header>

    <!-- 开关关闭空态（后端 fail-closed 403） -->
    <div
      v-if="disabledState"
      class="compare__state"
      data-testid="state-disabled"
    >
      <p>AI 对比暂未开启，敬请期待。</p>
    </div>

    <template v-else>
      <!-- ① 商品搜索与选择 -->
      <div
        class="compare__picker"
        data-testid="compare-picker"
      >
        <form
          class="compare__search"
          data-testid="compare-search-form"
          @submit.prevent="searchProducts"
        >
          <input
            v-model="searchKeyword"
            class="compare__search-box"
            type="search"
            placeholder="输入关键词搜索商品，如：轻薄本"
            data-testid="compare-search-input"
          >
          <button
            class="compare__search-btn"
            type="submit"
            :disabled="searching || !searchKeyword.trim()"
            data-testid="compare-search-button"
          >
            {{ searching ? '搜索中…' : '搜索' }}
          </button>
        </form>

        <p
          v-if="searched && candidates.length === 0"
          class="compare__hint"
          data-testid="compare-search-empty"
        >
          没有搜到相关商品，换个关键词试试。
        </p>

        <ul
          v-if="candidates.length > 0"
          class="compare__candidates"
          data-testid="compare-candidates"
        >
          <li
            v-for="item in candidates"
            :key="item.productId"
            class="compare__candidate"
            :class="{ 'compare__candidate--active': isSelected(item.productId) }"
            data-testid="compare-candidate"
          >
            <label class="compare__candidate-label">
              <input
                class="compare__checkbox"
                type="checkbox"
                :checked="isSelected(item.productId)"
                :disabled="!isSelected(item.productId) && selectedIds.length >= MAX_PRODUCTS"
                data-testid="compare-checkbox"
                @change="toggleSelect(item.productId)"
              >
              <span class="compare__candidate-name">{{ item.productName }}</span>
              <span class="compare__candidate-price">{{ item.priceHint }}</span>
            </label>
          </li>
        </ul>

        <div
          class="compare__selected"
          data-testid="compare-selected"
        >
          <span class="compare__selected-count">已选 {{ selectedIds.length }}/{{ MAX_PRODUCTS }} 件（至少 {{ MIN_PRODUCTS }} 件）</span>
          <ul class="compare__selected-list">
            <li
              v-for="item in selectedProducts"
              :key="item.productId"
              class="compare__selected-item"
              data-testid="compare-selected-item"
            >
              {{ item.productName }}
              <button
                class="compare__selected-remove"
                type="button"
                data-testid="compare-selected-remove"
                @click="toggleSelect(item.productId)"
              >×</button>
            </li>
          </ul>
        </div>

        <!-- 可选场景问题 -->
        <input
          v-model="question"
          class="compare__question"
          type="text"
          maxlength="200"
          placeholder="（可选）你最关心什么？如：哪个更适合玩游戏"
          data-testid="compare-question"
        >
        <button
          class="compare__submit"
          type="button"
          :disabled="!canSubmit"
          data-testid="compare-submit"
          @click="submit"
        >
          {{ loading ? '对比中…' : '开始对比' }}
        </button>
      </div>

      <!-- ② Loading -->
      <div
        v-if="loading"
        class="compare__state"
        data-testid="compare-loading"
      >
        <p>正在逐项对比，请稍候…</p>
      </div>

      <!-- ③ 对比结果 -->
      <template v-if="result && !loading">
        <div
          class="compare__table-wrap"
          data-testid="compare-result"
        >
          <table class="compare__table">
            <thead>
              <tr>
                <th class="compare__table-corner">对比维度</th>
                <th
                  v-for="p in result.products"
                  :key="p.productId"
                  class="compare__table-product"
                >
                  <img
                    v-if="p.image"
                    :src="p.image"
                    :alt="p.productName"
                    class="compare__product-img"
                  >
                  <span class="compare__product-name">{{ p.productName }}</span>
                  <span class="compare__product-price">￥{{ p.price }}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="dim in result.comparisonDimensions"
                :key="dim.dimension"
                data-testid="compare-dimension-row"
              >
                <th class="compare__table-dim">{{ dim.dimension }}</th>
                <td
                  v-for="p in result.products"
                  :key="p.productId"
                  class="compare__table-cell"
                  :class="{ 'compare__table-cell--missing': cellValue(dim.values, p.productId) === MISSING_CELL }"
                >
                  {{ cellValue(dim.values, p.productId) }}
                </td>
              </tr>
            </tbody>
          </table>
          <p class="compare__price-tip">价格以结算页为准</p>
        </div>

        <section
          class="compare__summary"
          data-testid="compare-summary"
        >
          <h2 class="compare__summary-title">AI 总结</h2>
          <p class="compare__summary-text">{{ result.summary }}</p>
        </section>
      </template>

      <!-- ④ 错误重试态 -->
      <div
        v-if="errorState"
        class="compare__state compare__state--error"
        data-testid="state-error"
      >
        <p>对比失败，请稍后重试。</p>
        <button
          class="compare__retry"
          data-testid="state-retry"
          @click="retry"
        >重试</button>
      </div>
    </template>
  </section>
</template>

<style scoped>
.compare {
  max-width: 960px;
  margin: 0 auto;
  padding: var(--space-5, 20px) var(--space-4, 16px) var(--space-8, 32px);
  display: flex;
  flex-direction: column;
  gap: 18px;
  min-height: 60vh;
}
.compare__title {
  margin: 0;
  font-size: 22px;
}
.compare__subtitle {
  margin: 4px 0 0;
  color: var(--color-text-secondary, #777);
  font-size: 13px;
}
.compare__picker {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border-radius: 16px;
  background: var(--color-surface, #fff);
  box-shadow: 0 2px 12px rgb(0 0 0 / 6%);
}
.compare__search {
  display: flex;
  gap: 8px;
}
.compare__search-box {
  flex: 1;
  padding: 10px 14px;
  border-radius: 999px;
  border: 1px solid var(--color-border, #e5e5e8);
  font-size: 14px;
  outline: none;
}
.compare__search-box:focus {
  border-color: var(--color-brand, #ff5b3a);
}
.compare__search-btn {
  padding: 0 20px;
  border: none;
  border-radius: 999px;
  background: var(--color-brand, #ff5b3a);
  color: #fff;
  font-size: 14px;
  cursor: pointer;
}
.compare__search-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.compare__hint {
  margin: 0;
  font-size: 13px;
  color: var(--color-text-secondary, #777);
}
.compare__candidates {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 320px;
  overflow-y: auto;
}
.compare__candidate {
  border: 1px solid var(--color-border, #eee);
  border-radius: 10px;
  transition:
    border-color 0.15s,
    background 0.15s;
}
.compare__candidate--active {
  border-color: var(--color-brand, #ff5b3a);
  background: var(--color-danger-bg, #fff4f0);
}
.compare__candidate-label {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 14px;
}
.compare__checkbox {
  flex: none;
}
.compare__candidate-name {
  flex: 1;
}
.compare__candidate-price {
  color: var(--color-brand, #ff5b3a);
  font-weight: 600;
  font-size: 13px;
  flex: none;
}
.compare__selected {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--color-text-secondary, #777);
}
.compare__selected-count {
  font-weight: 600;
}
.compare__selected-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  list-style: none;
  margin: 0;
  padding: 0;
}
.compare__selected-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px 3px 10px;
  border-radius: 999px;
  background: var(--color-surface-muted, #f4f4f6);
  font-size: 12px;
}
.compare__selected-remove {
  border: none;
  background: transparent;
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
  color: var(--color-text-secondary, #777);
  padding: 0 2px;
}
.compare__question {
  padding: 10px 14px;
  border-radius: 999px;
  border: 1px solid var(--color-border, #e5e5e8);
  font-size: 14px;
  outline: none;
}
.compare__question:focus {
  border-color: var(--color-brand, #ff5b3a);
}
.compare__submit {
  align-self: flex-start;
  padding: 10px 28px;
  border: none;
  border-radius: 999px;
  background: var(--gradient-brand, linear-gradient(135deg, #ff5b3a, #d6286e));
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}
.compare__submit:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.compare__state {
  padding: 24px;
  text-align: center;
  color: var(--color-text-secondary, #777);
  background: var(--color-surface-muted, #f4f4f6);
  border-radius: 14px;
  font-size: 14px;
}
.compare__state--error {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}
.compare__retry {
  padding: 6px 18px;
  border: none;
  border-radius: 999px;
  background: var(--color-brand, #ff5b3a);
  color: #fff;
  cursor: pointer;
}
.compare__table-wrap {
  overflow-x: auto;
  border-radius: 16px;
  background: var(--color-surface, #fff);
  box-shadow: 0 2px 12px rgb(0 0 0 / 6%);
  padding: 12px;
}
.compare__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.compare__table th,
.compare__table td {
  border: 1px solid var(--color-border, #ececef);
  padding: 10px;
  text-align: center;
  vertical-align: middle;
}
.compare__table-corner,
.compare__table-dim {
  background: var(--color-surface-muted, #f7f7f9);
  font-weight: 700;
  white-space: nowrap;
}
.compare__table-product {
  min-width: 140px;
}
.compare__product-img {
  display: block;
  width: 64px;
  height: 64px;
  object-fit: cover;
  border-radius: 8px;
  margin: 0 auto 6px;
}
.compare__product-name {
  display: block;
  font-size: 12px;
  margin-bottom: 4px;
}
.compare__product-price {
  display: block;
  color: var(--color-brand, #ff5b3a);
  font-weight: 700;
  font-size: 13px;
}
.compare__table-cell--missing {
  color: var(--color-text-tertiary, #aaa);
}
.compare__price-tip {
  margin: 10px 4px 2px;
  font-size: 12px;
  color: var(--color-text-tertiary, #aaa);
}
.compare__summary {
  padding: 16px;
  border-radius: 16px;
  background: linear-gradient(135deg, #fff4f0, #fde8f2);
}
.compare__summary-title {
  margin: 0 0 8px;
  font-size: 16px;
}
.compare__summary-text {
  margin: 0;
  font-size: 14px;
  line-height: 1.7;
}
</style>
