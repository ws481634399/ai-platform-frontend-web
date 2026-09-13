import http from '../http'
import type { ApiResponse } from '@/types'

export type ProductStatus = 'DRAFT' | 'ON_SALE' | 'OFF_SALE' | 'DISABLED'
export type SkuStatus = 'ENABLED' | 'DISABLED'
export type ImageType = 'MAIN' | 'GALLERY' | 'DETAIL' | 'SKU'

export interface ProductItem {
  id: number
  code: string
  name: string
  subtitle: string | null
  categoryId: number
  brandId: number
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
  id: number
  objectKey: string
  imageUrl: string
  imageType: ImageType
  sortOrder: number
  mainFlag: boolean
}

export interface AttributeView {
  id: number
  name: string
  value: string
  sortOrder: number
}

export interface SkuView {
  id: number
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
  categoryId?: number
  brandId?: number
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
  code?: string
  name: string
  subtitle?: string
  description?: string
  categoryId: number
  brandId: number
  images: ImagePayload[]
  attributes: AttributePayload[]
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

  async getById(id: number): Promise<ProductView> {
    return unwrap(await http.get(`/api/admin/products/${id}`))
  },

  async create(payload: SaveProductPayload): Promise<{ id: number }> {
    return unwrap(await http.post('/api/admin/products', payload))
  },

  async update(id: number, payload: SaveProductPayload): Promise<void> {
    await http.put(`/api/admin/products/${id}`, payload)
  },

  async changeStatus(id: number, status: ProductStatus): Promise<void> {
    await http.put(`/api/admin/products/${id}/status`, { status })
  },

  async publish(id: number): Promise<void> {
    await http.post(`/api/admin/products/${id}/publish`)
  },

  async unpublish(id: number): Promise<void> {
    await http.post(`/api/admin/products/${id}/unpublish`)
  },

  // ---------- SKU 子资源 ----------

  async addSku(productId: number, payload: SaveSkuPayload): Promise<{ id: number }> {
    return unwrap(await http.post(`/api/admin/products/${productId}/skus`, payload))
  },

  async updateSku(productId: number, skuId: number, payload: UpdateSkuPayload): Promise<void> {
    await http.put(`/api/admin/products/${productId}/skus/${skuId}`, payload)
  },

  async changeSkuStatus(productId: number, skuId: number, status: SkuStatus): Promise<void> {
    await http.put(`/api/admin/products/${productId}/skus/${skuId}/status`, { status })
  },
}
