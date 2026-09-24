import http from '../http'
import type { ApiResponse } from '@/types'

/**
 * 管理端订单 / 补偿 API（CHG-0019 M4）。
 * 雪花 ID 字符串；金额整数分；时间 ISO-8601。
 */

export type OrderStatus = 'PENDING_PAYMENT' | 'PAID' | 'SHIPPED' | 'COMPLETED' | 'CANCELLED'
export type OrderSource = 'CART' | 'BUY_NOW'

export interface OrderReceiverView {
  receiverName: string
  receiverPhone: string
  province: string
  city: string
  district: string
  detailAddress: string
  postalCode: string | null
}

export interface OrderItemView {
  productId: string
  skuId: string
  productName: string
  skuCode: string | null
  specifications: Record<string, string>
  mainImageUrl: string | null
  unitPriceFen: number
  quantity: number
  subtotalFen: number
}

export interface StatusHistoryView {
  fromStatus: string | null
  toStatus: string
  operation: string
  operator: string | null
  reason: string | null
  occurredAt: string
}

export interface OrderView {
  id: string
  orderNo: string
  status: OrderStatus
  source: OrderSource
  goodsAmountFen: number
  discountAmountFen: number
  freightAmountFen: number
  payAmountFen: number
  receiver: OrderReceiverView | null
  items: OrderItemView[]
  deliveryCompany: string | null
  trackingNo: string | null
  cancelReason: string | null
  createdAt: string
  paidAt: string | null
  cancelledAt: string | null
  shippedAt: string | null
  completedAt: string | null
  statusHistory: StatusHistoryView[]
}

export interface OrderSummaryItemView {
  skuId: string
  productName: string
  mainImageUrl: string | null
  quantity: number
  unitPriceFen: number
  subtotalFen: number
}

export interface OrderSummaryView {
  orderNo: string
  status: OrderStatus
  source: OrderSource
  goodsAmountFen: number
  payAmountFen: number
  createdAt: string
  items: OrderSummaryItemView[]
}

export interface PageView<T> {
  records: T[]
  total: number
  page: number
  size: number
}

export interface AdminOrderPageQuery {
  orderNo?: string
  memberId?: string
  status?: OrderStatus
  startAt?: string
  endAt?: string
  page?: number
  size?: number
}

export interface ShipRequest {
  deliveryCompany: string
  trackingNo: string
}

export type CompensationStatus = 'PENDING' | 'SUCCESS' | 'FAILED_DEAD'

export interface CompensationView {
  id: string
  businessType: string
  businessId: string
  operation: string
  payload: string | null
  status: CompensationStatus
  retryCount: number
  maxRetries: number
  lastError: string | null
  nextRetryAt: string | null
  createdAt: string
  updatedAt: string
  traceId?: string | null
}

function unwrap<T>(response: { data: ApiResponse<T> }): T {
  return response.data.data
}

export const orderApi = {
  async page(query: AdminOrderPageQuery = {}): Promise<PageView<OrderSummaryView>> {
    const params: Record<string, string | number> = { page: query.page ?? 1, size: query.size ?? 20 }
    if (query.orderNo?.trim()) params.orderNo = query.orderNo.trim()
    if (query.memberId?.trim()) params.memberId = query.memberId.trim()
    if (query.status) params.status = query.status
    if (query.startAt) params.startAt = query.startAt
    if (query.endAt) params.endAt = query.endAt
    return unwrap(await http.get('/api/admin/orders', { params }))
  },

  async detail(orderNo: string): Promise<OrderView> {
    return unwrap(await http.get(`/api/admin/orders/${encodeURIComponent(orderNo)}`))
  },

  async ship(orderNo: string, payload: ShipRequest): Promise<OrderView> {
    return unwrap(
      await http.post(`/api/admin/orders/${encodeURIComponent(orderNo)}/ship`, payload),
    )
  },
}

export const compensationApi = {
  async page(params: {
    operation?: string
    aggregateId?: string
    status?: CompensationStatus
    page?: number
    size?: number
  }): Promise<PageView<CompensationView>> {
    const query: Record<string, string | number> = {
      page: params.page ?? 1,
      size: params.size ?? 20,
    }
    if (params.operation?.trim()) query.operation = params.operation.trim()
    if (params.aggregateId?.trim()) query.aggregateId = params.aggregateId.trim()
    if (params.status) query.status = params.status
    return unwrap(await http.get('/api/admin/compensations', { params: query }))
  },

  async retry(id: string): Promise<CompensationView> {
    return unwrap(await http.post(`/api/admin/compensations/${encodeURIComponent(id)}/retry`))
  },

  /** 人工标记完成（CHG-0025 STORY-009-05-01，AC-038）。 */
  async complete(id: string): Promise<CompensationView> {
    return unwrap(await http.post(`/api/admin/compensations/${encodeURIComponent(id)}/complete`))
  },
}
