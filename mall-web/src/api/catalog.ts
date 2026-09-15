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

/** 分类树节点（公开分类树） */
export interface CategoryNode {
  id: string
  name: string
  sort: number
  children: CategoryNode[]
}

/** 品牌视图 */
export interface BrandView {
  id: string
  name: string
  logoUrl: string | null
  sort: number
}

/** 品牌分页 */
export interface BrandPage {
  items: BrandView[]
  total: number
  page: number
  size: number
}

/** 商品列表项 */
export interface ProductListItem {
  id: string
  productCode: string
  productName: string
  subtitle: string | null
  categoryId: string
  brandId: string
  mainImageUrl: string | null
  minPrice: number
  maxPrice: number
  status: string
}

/** 分页结果 */
export interface PageView<T> {
  records: T[]
  total: number
  page: number
  size: number
}

/** 商品列表查询参数 */
export interface ProductListQuery {
  keyword?: string
  categoryId?: string
  brandIds?: string[]
  sort?: string
  page?: number
  size?: number
}

/** 商品图片 */
export interface ProductImage {
  id: string
  imageUrl: string
  imageType: string
  sortOrder: number
  mainFlag: boolean
}

/** 商品属性 */
export interface ProductAttribute {
  id: string
  name: string
  value: string
  sortOrder: number
}

/** SKU 规格 */
export interface SkuSpecification {
  name: string
  value: string
}

/** SKU 视图 */
export interface SkuView {
  id: string
  skuCode: string
  specifications: SkuSpecification[]
  salePriceInCents: number
  status: string
  mainImageUrl: string | null
}

/** 分类路径节点 */
export interface CategoryPathNode {
  id: string
  name: string
}

/** 规格维度 */
export interface SpecDimension {
  name: string
  values: string[]
}

/** SKU 组合索引条目 */
export interface SkuIndexEntry {
  skuId: string
  priceFen: number
  imageUrl: string | null
  status: string
}

/** 商品详情 */
export interface ProductDetail {
  id: string
  productCode: string
  productName: string
  subtitle: string | null
  description: string | null
  categoryId: string
  brandId: string
  brandName: string | null
  categoryPath: CategoryPathNode[]
  mainImageUrl: string | null
  images: ProductImage[]
  attributes: ProductAttribute[]
  skus: SkuView[]
  dimensionsOrder: string[]
  specDimensions: SpecDimension[]
  skuIndex: Record<string, SkuIndexEntry>
  status: string
}

/** 库存状态：IN_STOCK / LOW_STOCK / OUT_OF_STOCK / UNKNOWN */
export type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'UNKNOWN'

/** SKU 可用性条目 */
export interface SkuAvailability {
  skuId: string
  stockStatus: StockStatus
}

function unwrap<T>(response: { data: ApiResponse<T> }): T {
  return response.data.data
}

/** 将查询参数序列化为 URL query（brandIds 逗号分隔） */
export function serializeProductQuery(query: ProductListQuery): Record<string, string> {
  const params: Record<string, string> = {}
  if (query.keyword) params.keyword = query.keyword
  if (query.categoryId) params.categoryId = query.categoryId
  if (query.brandIds && query.brandIds.length > 0) params.brandIds = query.brandIds.join(',')
  if (query.sort) params.sort = query.sort
  if (query.page) params.page = String(query.page)
  if (query.size) params.size = String(query.size)
  return params
}

export const catalogApi = {
  /** GET /api/mall/home 首页聚合 */
  async getHome(): Promise<HomeView> {
    return unwrap<HomeView>(await http.get('/api/mall/home'))
  },

  /** GET /api/mall/categories/tree 公开分类树 */
  async getCategoriesTree(): Promise<CategoryNode[]> {
    return unwrap<CategoryNode[]>(await http.get('/api/mall/categories/tree'))
  },

  /** GET /api/mall/brands 公开品牌分页 */
  async getBrands(page = 1, size = 200): Promise<BrandPage> {
    return unwrap<BrandPage>(await http.get('/api/mall/brands', { params: { page, size } }))
  },

  /** GET /api/mall/products 商品列表 */
  async getProducts(query: ProductListQuery): Promise<PageView<ProductListItem>> {
    return unwrap<PageView<ProductListItem>>(
      await http.get('/api/mall/products', { params: serializeProductQuery(query) }),
    )
  },

  /** GET /api/mall/products/{id} 商品详情 */
  async getProductDetail(id: string): Promise<ProductDetail> {
    return unwrap<ProductDetail>(await http.get(`/api/mall/products/${id}`))
  },

  /** POST /api/mall/skus/availability 批量查询 SKU 可售状态 */
  async getSkuAvailability(skuIds: string[]): Promise<SkuAvailability[]> {
    if (!skuIds.length) return []
    return unwrap<SkuAvailability[]>(
      await http.post('/api/mall/skus/availability', { skuIds }),
    )
  },
}
