/**
 * 会员资料表单规则（CHG-0016 / DU-FE-602），与后端 member 域规则保持一致：
 * - 昵称：1-32 字非空白（MemberProfile.NICKNAME_MAX_LENGTH，后端 @Size(1,32)）；
 * - 手机：空串=清空；非空须为 ^1[3-9]\d{9}$；
 * - 邮箱：空串=清空；非空须匹配宽松邮箱正则且长度 ≤128；
 * - 性别：UNKNOWN/MALE/FEMALE。
 * 前端为体验前置拦截，服务端仍按魔数/正则重新校验（安全边界在后端）。
 */
import type { MemberGender } from '@/types/member'

export const NICKNAME_MAX_LENGTH = 32
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024
const PHONE_PATTERN = /^1[3-9]\d{9}$/
const EMAIL_PATTERN = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+$/
const EMAIL_MAX_LENGTH = 128
const GENDERS: readonly MemberGender[] = ['UNKNOWN', 'MALE', 'FEMALE']
const AVATAR_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

export interface ProfileFormValues {
  nickname: string
  gender: string
  phone: string
  email: string
}

/** 字段名 → 中文错误（空串表示该字段通过）。 */
export type ProfileFieldErrors = Partial<Record<keyof ProfileFormValues, string>>

/** 校验资料表单；返回各字段错误（无错误字段缺省）。 */
export function validateProfileForm(input: ProfileFormValues): ProfileFieldErrors {
  const errors: ProfileFieldErrors = {}
  const nickname = input.nickname.trim()
  if (!nickname) {
    errors.nickname = '昵称不能为空'
  } else if (nickname.length > NICKNAME_MAX_LENGTH) {
    errors.nickname = `昵称不能超过${NICKNAME_MAX_LENGTH}字`
  }

  if (!GENDERS.includes(input.gender as MemberGender)) {
    errors.gender = '性别取值非法'
  }

  const phone = input.phone.trim()
  if (phone && !PHONE_PATTERN.test(phone)) {
    errors.phone = '手机号格式不正确'
  }

  const email = input.email.trim()
  if (email) {
    if (email.length > EMAIL_MAX_LENGTH || !EMAIL_PATTERN.test(email)) {
      errors.email = '邮箱格式不正确'
    }
  }
  return errors
}

/**
 * 头像选择前置校验：类型白名单（jpeg/png/webp）+ ≤2MB。
 * MIME 来自浏览器、可伪造，服务端会再读魔数；通过返回空串，否则返回中文提示。
 */
export function validateAvatarFile(file: File): string {
  if (!file) return '请选择要上传的图片'
  if (!AVATAR_TYPES.has(file.type)) return '仅支持 jpeg/png/webp 格式的图片'
  if (file.size > AVATAR_MAX_BYTES) return '头像大小不能超过2MB'
  return ''
}
