import http from './http'

/**
 * AI 智能应用 API（CHG-0024 DU-FE-001）。
 *
 * 契约（requirement-design §2.1）：
 * - 成功响应直出结构（ai-service 不包 UnifyResult 信封）；
 * - 错误响应为 UnifyResult 信封（{ success, code, message, traceId }），经 axios reject 抛出，
 *   由视图层按 status 分态（403 空态 / 4xx 提示 / 5xx 重试）；
 * - Bearer 与 X-Trace-Id 由 http.ts 拦截器统一注入，GUEST 请求自动无 Bearer。
 */

/** 推荐商品项（价格以 ai-service 归一的元字符串展示，逐条来自 Tool 真实数据） */
export interface AiRecommendationItem {
  productId: string
  productName: string
  image: string | null
  price: string
  reason: string
}

/** POST /api/ai/shopping/recommendations 成功响应 */
export interface AiShoppingResponse {
  conversationId: string
  message: string | null
  recommendations: AiRecommendationItem[]
  clarifyingQuestion: string | null
}

/** 推荐请求参数（conversationId 为空表示开启新会话） */
export interface AiShoppingRequest {
  conversationId?: string
  message: string
}

/** 对比请求参数（productIds 2~6 个、去重；question 为可选场景问题） */
export interface AiCompareRequest {
  productIds: string[]
  question?: string
}

/** 对比商品摘要（products[]，按入参 productIds 顺序；详情缺失商品照常列出） */
export interface AiCompareProductItem {
  productId: string
  productName: string
  image: string | null
  price: string
}

/** 维度行：values 键为 productId；Tool 未返回的属性统一"暂无该项数据"，不推测 */
export interface AiCompareDimension {
  dimension: string
  values: Record<string, string>
}

/** POST /api/ai/compare 成功响应 */
export interface AiCompareResponse {
  comparisonDimensions: AiCompareDimension[]
  products: AiCompareProductItem[]
  summary: string
}

/** 订单摘要卡片（totalAmount 为元两位小数字符串，后端已按 F-23 归一 statusText） */
export interface AiOrderItem {
  orderNo: string
  status: string
  statusText: string
  productName: string | null
  totalAmount: string
  createdAt: string | null
}

/** 待确认动作（actionId 一次性，TTL 10 分钟） */
export interface AiPendingAction {
  actionId: string
  type: string
  orderNo: string
  orderStatus: string
  summary: string
}

/** POST /api/ai/orders/assistant 成功响应 */
export interface AiOrdersAssistantResponse {
  conversationId: string
  message: string
  orders: AiOrderItem[]
  pendingAction: AiPendingAction | null
}

export interface AiOrdersAssistantRequest {
  conversationId?: string
  message: string
}

export interface AiOrdersConfirmRequest {
  conversationId: string
  actionId: string
  confirm: true
}

/** POST /api/ai/orders/assistant/confirm 成功响应（order.status 恒为 CANCELLED） */
export interface AiOrdersConfirmResponse {
  conversationId: string
  message: string
  order: AiOrderItem
}

/** POST /api/ai/support/chat 成功响应（无可靠知识时 answer 为固定兜底文案，sources 为空） */
export interface AiSupportResponse {
  answer: string
  sources: AiSupportSource[]
}

/** 引用来源（snippet 已由后端截断至 200 字符以内） */
export interface AiSupportSource {
  documentId: string
  title: string
  snippet: string
}

export interface AiSupportRequest {
  conversationId?: string
  question: string
}

export const aiApi = {
  /** AI 导购推荐（GUEST 可用；开关 fail-closed 由后端收口） */
  async recommendations(params: AiShoppingRequest): Promise<AiShoppingResponse> {
    const { data } = await http.post<AiShoppingResponse>('/api/ai/shopping/recommendations', params)
    return data
  },

  /** AI 商品对比（GUEST 可用；开关 fail-closed 由后端收口） */
  async compare(params: AiCompareRequest): Promise<AiCompareResponse> {
    const { data } = await http.post<AiCompareResponse>('/api/ai/compare', params)
    return data
  },

  /** 订单助手问答请求（conversationId 为空表示开启新会话；强制 MEMBER，401 由视图引导登录） */
  async ordersAssistant(params: AiOrdersAssistantRequest): Promise<AiOrdersAssistantResponse> {
    const { data } = await http.post<AiOrdersAssistantResponse>('/api/ai/orders/assistant', params)
    return data
  },

  /**
   * 待执行动作二次确认（confirm 必须为 true 才会真正写）。
   * 409 原样 reject（状态不允许取消 / 令牌缺失或已消费），由视图透出后端 message。
   */
  async ordersConfirm(params: AiOrdersConfirmRequest): Promise<AiOrdersConfirmResponse> {
    const { data } = await http.post<AiOrdersConfirmResponse>('/api/ai/orders/assistant/confirm', params)
    return data
  },

  /** RAG 智能客服（GUEST 可用；开关 fail-closed 由后端收口） */
  async supportChat(params: AiSupportRequest): Promise<AiSupportResponse> {
    const { data } = await http.post<AiSupportResponse>('/api/ai/support/chat', params)
    return data
  },
}
