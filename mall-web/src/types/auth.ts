/**
 * 会员认证相关类型（CHG-0016 STORY-003-01-01-02 / DU-FE-601）。
 * 契约对齐后端 MemberAuthController：UnifyResult<MemberTokenResponse>。
 */

/** 登录/注册请求（字段与后端 MemberLoginRequest/RegisterMemberRequest 同名） */
export interface MemberCredentialRequest {
  username: string
  password: string
}

/** 登录/刷新返回的双令牌（memberId 为字符串雪花 ID，禁止数值化） */
export interface MemberTokenPair {
  accessToken: string
  accessExpiresAt: string
  refreshToken: string
  memberId: string
}

/** 注册成功响应 */
export interface MemberRegisterResult {
  memberId: string
}
