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

export const aiApi = {
  /** AI 导购推荐（GUEST 可用；开关 fail-closed 由后端收口） */
  async recommendations(params: AiShoppingRequest): Promise<AiShoppingResponse> {
    const { data } = await http.post<AiShoppingResponse>('/api/ai/shopping/recommendations', params)
    return data
  },
}
