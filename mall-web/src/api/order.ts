import http from './http'
import type { ApiResponse } from '@/types'
import type {
  CreateOrderRequest,
  OrderPageQuery,
  OrderSummaryView,
  OrderView,
  PageView,
  PreviewRequest,
  PreviewView,
} from '@/types/order'

function unwrap<T>(response: { data: ApiResponse<T> }): T {
  return response.data.data
}

/**
 * 会员订单 API（CHG-0019，/api/mall/orders）。
 *
 * 金额一律整数分；雪花 ID 字符串；会员身份由网关注入，接口不带 memberId。
 */
export const orderApi = {
  /** 结算预览：服务端实时重查商品/库存/地址，可下单时签发 submitToken。 */
  async preview(request: PreviewRequest): Promise<PreviewView> {
    return unwrap<PreviewView>(await http.post('/api/mall/orders/preview', request))
  },

  /** 正式创建订单（双层幂等：submitToken 一次性消费）。 */
  async create(request: CreateOrderRequest): Promise<OrderView> {
    return unwrap<OrderView>(await http.post('/api/mall/orders', request))
  },

  /** 我的订单分页（?status&page&size&startAt&endAt）。 */
  async page(query: OrderPageQuery = {}): Promise<PageView<OrderSummaryView>> {
    const params: Record<string, string | number> = {}
    if (query.status) params.status = query.status
    if (query.startAt) params.startAt = query.startAt
    if (query.endAt) params.endAt = query.endAt
    params.page = query.page ?? 1
    params.size = query.size ?? 10
    return unwrap<PageView<OrderSummaryView>>(await http.get('/api/mall/orders', { params }))
  },

  /** 订单详情（越权统一 404）。 */
  async detail(orderNo: string): Promise<OrderView> {
    return unwrap<OrderView>(
      await http.get(`/api/mall/orders/${encodeURIComponent(orderNo)}`),
    )
  },

  /** 模拟支付（重复支付幂等成功）。 */
  async pay(orderNo: string): Promise<OrderView> {
    return unwrap<OrderView>(
      await http.post(`/api/mall/orders/${encodeURIComponent(orderNo)}/pay`),
    )
  },

  /** 取消待支付订单（重复取消幂等成功；原因可选）。 */
  async cancel(orderNo: string, reason?: string): Promise<OrderView> {
    return unwrap<OrderView>(
      await http.post(
        `/api/mall/orders/${encodeURIComponent(orderNo)}/cancel`,
        reason ? { reason } : {},
      ),
    )
  },

  /** 确认收货（SHIPPED → COMPLETED）。 */
  async confirmReceipt(orderNo: string): Promise<OrderView> {
    return unwrap<OrderView>(
      await http.post(`/api/mall/orders/${encodeURIComponent(orderNo)}/confirm-receipt`),
    )
  },
}
