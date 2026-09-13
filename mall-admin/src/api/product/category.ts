import http from '../http'
import type { ApiResponse } from '@/types'

/** 分类树节点（对齐后端 CategoryTreeView） */
export interface CategoryNode {
  id: number
  name: string
  parentId: number
  level: number
  sort: number
  status: 'ENABLED' | 'DISABLED'
  children?: CategoryNode[]
}

/** 新增/编辑请求体（parentId=0 或缺省表示一级分类） */
export interface CategoryPayload {
  name: string
  parentId?: number
  sort?: number
}

export type CategoryStatus = 'ENABLED' | 'DISABLED'

function unwrap<T>(response: { data: ApiResponse<T> }): T {
  return response.data.data
}

export const categoryApi = {
  async tree(): Promise<CategoryNode[]> {
    return unwrap<CategoryNode[]>(await http.get('/api/admin/categories/tree'))
  },

  async get(id: number): Promise<Omit<CategoryNode, 'children'>> {
    return unwrap(await http.get(`/api/admin/categories/${id}`))
  },

  async create(payload: CategoryPayload): Promise<{ id: number }> {
    return unwrap(await http.post('/api/admin/categories', payload))
  },

  async update(id: number, payload: CategoryPayload): Promise<void> {
    await http.put(`/api/admin/categories/${id}`, payload)
  },

  async changeStatus(id: number, status: CategoryStatus): Promise<void> {
    await http.put(`/api/admin/categories/${id}/status`, { status })
  },
}
