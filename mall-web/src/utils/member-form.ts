/**
 * 会员表单规则（与后端 identity 域规则保持一致，CHG-0016 / DU-FE-601）：
 * - 用户名：字母开头 + 字母数字下划线，总长 4-20（MemberUsername.PATTERN）；
 * - 密码：8-32 位且必须同时含字母与数字（MemberPasswordPolicy，拒绝纯数字/纯字母）。
 */
const USERNAME_PATTERN = /^[A-Za-z][A-Za-z0-9_]{3,19}$/
const PASSWORD_MIN = 8
const PASSWORD_MAX = 32

/** 规则违例返回中文提示；通过返回空串。 */
export function validateMemberCredential(input: {
  username: string
  password: string
}): string {
  const username = input.username.trim()
  if (!username) return '用户名不能为空'
  if (!USERNAME_PATTERN.test(username)) return '用户名需为 4-20 位字母开头的字母、数字或下划线'
  if (!input.password) return '密码不能为空'
  if (input.password.length < PASSWORD_MIN || input.password.length > PASSWORD_MAX) {
    return '密码长度需为 8-32 位'
  }
  if (!/[A-Za-z]/.test(input.password) || !/\d/.test(input.password)) {
    return '密码必须同时包含字母与数字'
  }
  return ''
}

/** 提交前用户名归一（trim；后端按 username_norm 小写比较，前端保留原大小写提交）。 */
export function normalizeUsername(raw: string): string {
  return raw.trim()
}
