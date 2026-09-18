import http from './http'
import type { ApiResponse } from '@/types'

/**
 * 商城商品搜索公开 API（CHG-0020 FE-501）。
 *
 * 契约：GET /api/mall/search/products（经 UnifyResult 解包）。
 * 金额域统一为整数分（number）；业务 ID（productId 等）遵循 @StringId 规范为字符串，
 * 规避雪花 long 超出 JS Number.MAX_SAFE_INTEGER 的精度问题（与 catalog.ts 同口径）。
 * 搜索返回摘要 DTO 而非商品聚合，字段白名单与后端冻结一致。
 */

/** 搜索排序：'' 默认（不传参，走后端综合排序）/ price_asc / price_desc / newest */
export type ProductSearchSort = '' | 'price_asc' | 'price_desc' | 'newest'

/** 搜索结果摘要项（仅结果页卡片所需字段；productId 为字符串化业务 ID） */
export interface ProductSearchItem {
  productId: string
  productName: string
  mainImage: string | null
  minPrice: number | null
  maxPrice: number | null
  brandName: string | null
  categoryName: string | null
}

/** 搜索分页结果（items/total/page/size） */
export interface ProductSearchPage {
  items: ProductSearchItem[]
  total: number
  page: number
  size: number
}

/** 商品搜索查询参数（分类/品牌 ID 为字符串，URL query 原样透传，保精度） */
export interface ProductSearchQuery {
  keyword?: string
  categoryId?: string
  brandId?: string
  minPriceFen?: number
  maxPriceFen?: number
  sort?: ProductSearchSort
  page?: number
  size?: number
}

function unwrap<T>(response: { data: ApiResponse<T> }): T {
  return response.data.data
}

/** 将搜索参数序列化为 URL query：空值省略；sort='' 不传（后端默认综合排序） */
export function serializeSearchQuery(query: ProductSearchQuery): Record<string, string> {
  const params: Record<string, string> = {}
  if (query.keyword) params.keyword = query.keyword
  if (query.categoryId != null) params.categoryId = String(query.categoryId)
  if (query.brandId != null) params.brandId = String(query.brandId)
  if (query.minPriceFen != null) params.minPriceFen = String(query.minPriceFen)
  if (query.maxPriceFen != null) params.maxPriceFen = String(query.maxPriceFen)
  if (query.sort) params.sort = query.sort
  if (query.page != null) params.page = String(query.page)
  if (query.size != null) params.size = String(query.size)
  return params
}

export const searchApi = {
  /** GET /api/mall/search/products 商品搜索（关键词/分类/品牌/价区/排序/分页） */
  async products(query: ProductSearchQuery): Promise<ProductSearchPage> {
    return unwrap<ProductSearchPage>(
      await http.get('/api/mall/search/products', { params: serializeSearchQuery(query) }),
    )
  },
}
