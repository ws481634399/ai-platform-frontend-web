import http from './http'
import type { ApiResponse } from '@/types'

/**
 * 商城首页/商品浏览公开 API（CHG-0017）。
 *
 * 金额域统一为整数分（number），展示层由 PriceText 组件负责转 ¥。
 * ID 域为字符串（后端 @StringId long→string）。
 */

/** 首页分类入口 */
export interface CategoryEntry {
  id: string
  name: string
  iconImageUrl: string | null
}

/** 商品卡片（首页/列表共用字段子集） */
export interface ProductCard {
  id: string
  name: string
  mainImageUrl: string | null
  minPrice: number | null
  maxPrice: number | null
}

/** 推荐位（M3 fallback 同新品） */
export interface RecommendItem extends ProductCard {
  source: string
}

/** Banner（M3 空数组占位） */
export interface Banner {
  id: string
  imageUrl: string
  linkUrl: string
}

/** 首页聚合视图 */
export interface HomeView {
  categoryEntries: CategoryEntry[]
  newArrivals: ProductCard[]
  recommends: RecommendItem[]
  banners: Banner[]
}

function unwrap<T>(response: { data: ApiResponse<T> }): T {
  return response.data.data
}

export const catalogApi = {
  /** GET /api/mall/home 首页聚合 */
  async getHome(): Promise<HomeView> {
    return unwrap<HomeView>(await http.get('/api/mall/home'))
  },
}
