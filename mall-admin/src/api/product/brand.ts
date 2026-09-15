import http from '../http'
import type { ApiResponse } from '@/types'

export type BrandStatus = 'ENABLED' | 'DISABLED'

/** 品牌列表项（对齐后端 BrandView；雪花 ID 后端以字符串出参，CHG-0015） */
export interface BrandItem {
  id: string
  name: string
  logo: string | null
  description: string | null
  sort: number
  status: BrandStatus
}

/** 分页查询条件 */
export interface BrandQuery {
  keyword?: string
  status?: BrandStatus | ''
  page: number
  size: number
}

/** 新增/编辑请求体 */
export interface SaveBrandPayload {
  name: string
  logo?: string
  description?: string
  sort?: number
}

/** 统一分页视图（对齐后端 PageView） */
export interface PageView<T> {
  records: T[]
  total: number
  page: number
  size: number
}

function unwrap<T>(response: { data: ApiResponse<T> }): T {
  return response.data.data
}

export const brandApi = {
  async page(query: BrandQuery): Promise<PageView<BrandItem>> {
    return unwrap(
      await http.get('/api/admin/brands', {
        params: {
          keyword: query.keyword || undefined,
          status: query.status || undefined,
          page: query.page,
          size: query.size,
        },
      }),
    )
  },

  async create(payload: SaveBrandPayload): Promise<{ id: string }> {
    return unwrap(await http.post('/api/admin/brands', payload))
  },

  async update(id: string, payload: SaveBrandPayload): Promise<void> {
    await http.put(`/api/admin/brands/${id}`, payload)
  },

  async changeStatus(id: string, status: BrandStatus): Promise<void> {
    await http.put(`/api/admin/brands/${id}/status`, { status })
  },
}
