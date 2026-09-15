/**
 * 会员资料相关类型（CHG-0016 STORY-003-01-02-01 / DU-FE-602）。
 * 契约对齐后端 MemberProfileDtos：UnifyResult<ProfileView> / AvatarUploadResponse。
 */

/** 性别（对齐后端 Gender 枚举；UNKNOWN 为默认/保密） */
export type MemberGender = 'UNKNOWN' | 'MALE' | 'FEMALE'

/** GET/PUT /api/mall/members/me 返回的资料视图（memberId 为字符串雪花 ID） */
export interface MemberProfile {
  memberId: string
  username: string
  nickname: string
  avatarUrl: string | null
  gender: MemberGender
  phone: string | null
  email: string | null
}

/**
 * 修改资料请求（部分更新）：字段缺省/null 表示保留原值；phone/email 空串表示清空。
 * memberId 永不出现在请求体（SSOT：story-design §2）。
 */
export interface UpdateMemberProfileRequest {
  nickname?: string | null
  gender?: MemberGender | null
  phone?: string | null
  email?: string | null
}

/** POST /api/mall/members/me/avatar 响应 */
export interface AvatarUploadResult {
  avatarUrl: string
}
