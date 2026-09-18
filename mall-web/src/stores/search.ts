import { ref } from 'vue'
import { defineStore } from 'pinia'
import {
  searchApi,
  type ProductSearchItem,
  type ProductSearchQuery,
  type ProductSearchSort,
} from '@/api/search'
import { resolveErrorMessage } from '@/utils/http-error'

/** 搜索筛选条件（分类/品牌 ID 为字符串，金额为整数分） */
export interface SearchFilters {
  categoryId?: string
  brandId?: string
  minPriceFen?: number
  maxPriceFen?: number
}

/**
 * 商品搜索 Store（CHG-0020 FE-501，setup 风格，范式同 stores/cart.ts）。
 *
 * 仅持有最近一次搜索的查询态与结果态；query 与 route.query 的双向同步由视图层负责
 *（URL 为唯一状态源）。自带请求序号竞态防护：旧响应不落库。
 */
export const useSearchStore = defineStore('search', () => {
  const keyword = ref('')
  const filters = ref<SearchFilters>({})
  const sort = ref<ProductSearchSort>('')
  const page = ref(1)
  const size = ref(20)
  const items = ref<ProductSearchItem[]>([])
  const total = ref(0)
  const loading = ref(false)
  const error = ref('')

  /** 自增请求序号，防竞态：仅最后一次响应落库 */
  let requestSeq = 0

  /** 执行搜索；查询态同步落 store，供分页/结果文案读取 */
  async function search(params: ProductSearchQuery): Promise<void> {
    const seq = ++requestSeq
    loading.value = true
    error.value = ''

    keyword.value = params.keyword ?? ''
    filters.value = {
      categoryId: params.categoryId,
      brandId: params.brandId,
      minPriceFen: params.minPriceFen,
      maxPriceFen: params.maxPriceFen,
    }
    sort.value = params.sort ?? ''
    page.value = params.page ?? 1
    size.value = params.size ?? 20

    try {
      const data = await searchApi.products(params)
      if (seq !== requestSeq) return // 竞态：丢弃旧响应
      items.value = data.items
      total.value = data.total
      page.value = data.page
      size.value = data.size
    } catch (e) {
      if (seq !== requestSeq) return
      error.value = resolveErrorMessage(e, '搜索失败，请稍后重试')
      items.value = []
      total.value = 0
    } finally {
      if (seq === requestSeq) loading.value = false
    }
  }

  /** 重置筛选与排序（回到第 1 页） */
  function resetFilters(): void {
    filters.value = {}
    sort.value = ''
    page.value = 1
  }

  return {
    keyword,
    filters,
    sort,
    page,
    size,
    items,
    total,
    loading,
    error,
    search,
    resetFilters,
  }
})
