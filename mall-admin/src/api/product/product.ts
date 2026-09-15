import http from '../http'
import type { ApiResponse } from '@/types'

export type ProductStatus = 'DRAFT' | 'ON_SALE' | 'OFF_SALE' | 'DISABLED'
export type SkuStatus = 'ENABLED' | 'DISABLED'
export type ImageType = 'MAIN' | 'GALLERY' | 'DETAIL' | 'SKU'

export interface ProductItem {
  // 雪花 ID 超出 JS 安全整数，后端以字符串出参（CHG-0015 @StringId），前端全程保持字符串
  id: string
  code: string
  name: string
  subtitle: string | null
  categoryId: string
  brandId: string
  status: ProductStatus
  mainImageUrl: string | null
}

export interface ProductView extends ProductItem {
  description: string | null
  images: ImageView[]
  attributes: AttributeView[]
  skus: SkuView[]
}

export interface ImageView {
  id: string
  objectKey: string
  imageUrl: string
  imageType: ImageType
  sortOrder: number
  mainFlag: boolean
}

export interface AttributeView {
  id: string
  name: string
  value: string
  sortOrder: number
}

export interface SkuView {
  id: string
  skuCode: string
  specifications: SpecificationView[]
  salePriceInCents: number
  status: SkuStatus
  mainImageUrl: string | null
}

export interface SpecificationView {
  name: string
  value: string
}

export interface ProductQuery {
  keyword?: string
  categoryId?: string
  brandId?: string
  status?: ProductStatus | ''
  page: number
  size: number
}

export interface PageView<T> {
  records: T[]
  total: number
  page: number
  size: number
}

export interface SaveProductPayload {
  name: string
  subtitle?: string
  description?: string
  categoryId: string
  brandId: string
  images: ImagePayload[]
  attributes: AttributePayload[]
}

export interface CreateProductPayload extends SaveProductPayload {
  code: string
  skus: SaveSkuPayload[]
}

export interface ImagePayload {
  objectKey: string
  imageUrl: string
  imageType: ImageType
  sortOrder: number
  mainFlag: boolean
}

export interface AttributePayload {
  name: string
  value: string
  sortOrder: number
}

export interface SaveSkuPayload {
  skuCode: string
  specifications: SpecificationView[]
  salePriceInCents: number
  mainImageUrl?: string
}

export interface UpdateSkuPayload {
  salePriceInCents: number
  mainImageUrl?: string
}

function unwrap<T>(response: { data: ApiResponse<T> }): T {
  return response.data.data
}

export const productApi = {
  async page(query: ProductQuery): Promise<PageView<ProductItem>> {
    return unwrap(
      await http.get('/api/admin/products', {
        params: {
          keyword: query.keyword || undefined,
          categoryId: query.categoryId,
          brandId: query.brandId,
          status: query.status || undefined,
          page: query.page,
          size: query.size,
        },
      }),
    )
  },

  async getById(id: string): Promise<ProductView> {
    return unwrap(await http.get(`/api/admin/products/${id}`))
  },

  async create(payload: CreateProductPayload): Promise<{ id: string }> {
    return unwrap(await http.post('/api/admin/products', payload))
  },

  async update(id: string, payload: SaveProductPayload): Promise<void> {
    await http.put(`/api/admin/products/${id}`, payload)
  },

  async changeStatus(id: string, status: ProductStatus): Promise<void> {
    await http.put(`/api/admin/products/${id}/status`, { status })
  },

  async publish(id: string): Promise<void> {
    await http.post(`/api/admin/products/${id}/publish`)
  },

  async unpublish(id: string): Promise<void> {
    await http.post(`/api/admin/products/${id}/unpublish`)
  },

  // ---------- SKU 子资源 ----------

  async addSku(productId: string, payload: SaveSkuPayload): Promise<{ id: string }> {
    return unwrap(await http.post(`/api/admin/products/${productId}/skus`, payload))
  },

  async updateSku(productId: string, skuId: string, payload: UpdateSkuPayload): Promise<void> {
    await http.put(`/api/admin/products/${productId}/skus/${skuId}`, payload)
  },

  async changeSkuStatus(productId: string, skuId: string, status: SkuStatus): Promise<void> {
    await http.put(`/api/admin/products/${productId}/skus/${skuId}/status`, { status })
  },
}
