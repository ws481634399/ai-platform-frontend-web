import http from '../http'
import type { ApiResponse } from '@/types'

/** 分类树节点（对齐后端 CategoryTreeView；雪花 ID 后端以字符串出参，CHG-0015） */
export interface CategoryNode {
  id: string
  name: string
  /** 一级分类父级为 "0" */
  parentId: string
  level: number
  sort: number
  status: 'ENABLED' | 'DISABLED'
  children?: CategoryNode[]
}

/** 新增/编辑请求体（parentId="0" 或缺省表示一级分类） */
export interface CategoryPayload {
  name: string
  parentId?: string
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

  async get(id: string): Promise<Omit<CategoryNode, 'children'>> {
    return unwrap(await http.get(`/api/admin/categories/${id}`))
  },

  async create(payload: CategoryPayload): Promise<{ id: string }> {
    return unwrap(await http.post('/api/admin/categories', payload))
  },

  async update(id: string, payload: CategoryPayload): Promise<void> {
    await http.put(`/api/admin/categories/${id}`, payload)
  },

  async changeStatus(id: string, status: CategoryStatus): Promise<void> {
    await http.put(`/api/admin/categories/${id}/status`, { status })
  },
}
