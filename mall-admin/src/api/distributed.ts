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

/**
 * 延迟取消任务（CHG-0025 M7 STORY-009-04-01）。
 */
export type DelayTaskStatus = 'PENDING' | 'CANCELLED' | 'FAILED'

export interface DelayTaskView {
  orderId: number
  orderNo: string
  delayStatus: DelayTaskStatus
  createdAt: string
  cancelledAt: string | null
  lastError: string | null
}

export const delayTaskApi = {
  async page(params: {
    status?: DelayTaskStatus
    page?: number
    size?: number
  }): Promise<PageView<DelayTaskView>> {
    const query: Record<string, string | number> = {
      page: params.page ?? 1,
      size: params.size ?? 20,
    }
    if (params.status) query.status = params.status
    return unwrap(await http.get('/api/admin/order-delay/tasks', { params: query }))
  },

  /** 人工介入取消；原因空白时由后端落默认原因。 */
  async cancel(orderId: number, reason?: string): Promise<DelayTaskView> {
    const trimmed = reason?.trim()
    return unwrap(
      await http.post(
        `/api/admin/order-delay/tasks/${encodeURIComponent(String(orderId))}/cancel`,
        trimmed ? { reason: trimmed } : {},
      ),
    )
  },
}
