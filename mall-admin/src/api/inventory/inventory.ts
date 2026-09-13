import http from '../http'
import type { ApiResponse } from '@/types'

/** 库存视图（对齐后端 InventoryView） */
export interface InventoryItem {
  skuId: number
  totalQuantity: number
  lockedQuantity: number
  availableQuantity: number
}

/** 库存流水视图（对齐后端 LogView） */
export interface InventoryLogItem {
  id: number
  skuId: number
  operationType: string
  quantity: number
  beforeQuantity: number
  afterQuantity: number
  businessId: string | null
  operator: number | null
  traceId: string | null
  occurredAt: string
}

/** 统一分页视图 */
export interface PageView<T> {
  records: T[]
  total: number
  page: number
  size: number
}

function unwrap<T>(response: { data: ApiResponse<T> }): T {
  return response.data.data
}

export const inventoryApi = {
  async page(params: { skuId?: number; page?: number; size?: number }): Promise<PageView<InventoryItem>> {
    return unwrap(await http.get('/api/admin/inventory/stocks', { params }))
  },

  async get(skuId: number): Promise<InventoryItem> {
    return unwrap(await http.get(`/api/admin/inventory/stocks/${skuId}`))
  },

  async init(payload: { skuId: number; totalQuantity: number }): Promise<InventoryItem> {
    return unwrap(await http.post('/api/admin/inventory/stocks/init', payload))
  },

  async adjust(skuId: number, payload: { delta: number; reason?: string; businessId?: string }): Promise<InventoryItem> {
    return unwrap(await http.post(`/api/admin/inventory/stocks/${skuId}/adjust`, payload))
  },

  async logs(params: { skuId?: number; page?: number; size?: number }): Promise<PageView<InventoryLogItem>> {
    return unwrap(await http.get('/api/admin/inventory/logs', { params }))
  },
}
