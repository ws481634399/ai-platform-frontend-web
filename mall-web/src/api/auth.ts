import http from './http'
import type { ApiResponse } from '@/types'
import type { MemberCredentialRequest, MemberRegisterResult, MemberTokenPair } from '@/types/auth'

function unwrap<T>(response: { data: ApiResponse<T> }): T {
  return response.data.data
}

/**
 * 会员认证 API（端点经网关 8080 路由至 identity 8101）。
 *
 * refresh/logout 依赖登录响应双发的 HttpOnly refresh_token cookie（与 mall-admin
 * 现状一致），因此必须带 withCredentials；refreshToken 响应体字段仅作合同透传，
 * 前端不另行持久化（requirement-design §8：dev 阶段对齐 admin 实际实现）。
 */
export const memberAuthApi = {
  async register(request: MemberCredentialRequest): Promise<MemberRegisterResult> {
    return unwrap<MemberRegisterResult>(await http.post('/api/auth/member/register', request))
  },

  async login(request: MemberCredentialRequest): Promise<MemberTokenPair> {
    return unwrap<MemberTokenPair>(await http.post('/api/auth/member/login', request))
  },

  async refresh(): Promise<MemberTokenPair> {
    return unwrap<MemberTokenPair>(
      await http.post('/api/auth/member/refresh', undefined, { withCredentials: true }),
    )
  },

  async logout(): Promise<void> {
    await http.post('/api/auth/member/logout', undefined, { withCredentials: true })
  },
}
