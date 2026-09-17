/**
 * 订单相关类型（CHG-0019 M4 订单交易闭环）。
 *
 * 契约对齐后端 mall-order OrderDtos：
 * 雪花 ID 一律 string；金额一律整数分（*Fen）；时间为 ISO-8601 字符串。
 */

/** 订单来源：购物车结算 / 立即购买 */
export type OrderSource = 'CART' | 'BUY_NOW'

/** 订单状态机（SSOT：后端 OrderStatus） */
export type OrderStatus = 'PENDING_PAYMENT' | 'PAID' | 'SHIPPED' | 'COMPLETED' | 'CANCELLED'

/** 预览行库存状态：OK / LOW（≤10）/ OUT_OF_STOCK */
export type PreviewStockStatus = 'OK' | 'LOW' | 'OUT_OF_STOCK'

/** 预览/下单请求行（BUY_NOW 使用；CART 下单服务端以令牌载荷为准） */
export interface OrderItemRequest {
  skuId: string
  quantity: number
}

/** POST /api/mall/orders/preview 请求体 */
export interface PreviewRequest {
  source: OrderSource
  addressId?: string
  items?: OrderItemRequest[]
}

/** POST /api/mall/orders 请求体（双层幂等：submitToken） */
export interface CreateOrderRequest {
  submitToken: string
  addressId: string
  source: OrderSource
  items?: OrderItemRequest[]
}

/** 预览地址视图（带 addressId，供确认页切换） */
export interface OrderAddressView {
  addressId: string
  receiverName: string
  receiverPhone: string
  province: string
  city: string
  district: string
  detailAddress: string
  postalCode: string | null
}

/** 订单收货快照 */
export interface OrderReceiverView {
  receiverName: string
  receiverPhone: string
  province: string
  city: string
  district: string
  detailAddress: string
  postalCode: string | null
}

/** 预览商品行 */
export interface PreviewItemView {
  skuId: string
  productId: string
  productName: string
  skuCode: string | null
  specifications: Record<string, string>
  mainImageUrl: string | null
  quantity: number
  unitPriceFen: number
  subtotalFen: number
  salable: boolean
  stockStatus: PreviewStockStatus
  issueCodes: string[]
}

/** 预览响应 */
export interface PreviewView {
  submitToken: string | null
  address: OrderAddressView | null
  items: PreviewItemView[]
  goodsAmountFen: number
  discountAmountFen: number
  freightAmountFen: number
  payAmountFen: number
  availableToSubmit: boolean
}

/** 订单商品快照行 */
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

/** 状态轨迹行 */
export interface StatusHistoryView {
  fromStatus: string | null
  toStatus: string
  operation: string
  operator: string | null
  reason: string | null
  occurredAt: string
}

/** 订单完整视图 */
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

/** 列表行商品摘要 */
export interface OrderSummaryItemView {
  skuId: string
  productName: string
  mainImageUrl: string | null
  quantity: number
  unitPriceFen: number
  subtotalFen: number
}

/** 订单列表摘要行 */
export interface OrderSummaryView {
  orderNo: string
  status: OrderStatus
  source: OrderSource
  goodsAmountFen: number
  payAmountFen: number
  createdAt: string
  items: OrderSummaryItemView[]
}

/** 分页视图 */
export interface PageView<T> {
  records: T[]
  total: number
  page: number
  size: number
}

/** GET /api/mall/orders 查询参数 */
export interface OrderPageQuery {
  status?: OrderStatus
  startAt?: string
  endAt?: string
  page?: number
  size?: number
}
