import http from './http'
import type { ApiResponse } from '@/types'

/**
 * 分布式增强管理端 API（CHG-0025 M7）：Outbox 事件查询与手动重投。
 */

export type OutboxStatus = 'PENDING' | 'SENDING' | 'SENT' | 'FAILED'

export interface OutboxView {
  id: number
  aggregateId: string
  eventType: string
  payload: string
  status: OutboxStatus
  retryCount: number
  nextRetryAt: string | null
  traceId: string | null
  lastError: string | null
  createdAt: string
  sentAt: string | null
}

export interface PageView<T> {
  records: T[]
  total: number
  page: number
  size: number
}

function unwrap<T>(response: { data: ApiResponse<T> }): T {
  return response.data.data
}

export const outboxApi = {
  async page(params: {
    status?: OutboxStatus
    eventType?: string
    aggregateId?: string
    page?: number
    size?: number
  }): Promise<PageView<OutboxView>> {
    const query: Record<string, string | number> = {
      page: params.page ?? 1,
      size: params.size ?? 20,
    }
    if (params.status) query.status = params.status
    if (params.eventType?.trim()) query.eventType = params.eventType.trim()
    if (params.aggregateId?.trim()) query.aggregateId = params.aggregateId.trim()
    return unwrap(await http.get('/api/admin/outbox/events', { params: query }))
  },

  async get(id: number): Promise<OutboxView> {
    return unwrap(await http.get(`/api/admin/outbox/events/${encodeURIComponent(String(id))}`))
  },

  async retry(id: number): Promise<OutboxView> {
    return unwrap(await http.post(`/api/admin/outbox/events/${encodeURIComponent(String(id))}/retry`))
  },
}
