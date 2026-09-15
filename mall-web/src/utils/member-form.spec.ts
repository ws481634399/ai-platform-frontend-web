import { describe, expect, it } from 'vitest'
import { normalizeUsername, validateMemberCredential } from './member-form'

describe('会员表单规则（与后端 MemberUsername/MemberPasswordPolicy 一致）', () => {
  it('合规凭据通过', () => {
    expect(validateMemberCredential({ username: 'Mall_User01', password: 'abc12345' })).toBe('')
    expect(validateMemberCredential({ username: 'abcd', password: 'Aa1Aa1Aa1Aa1Aa1Aa1Aa1Aa1Aa1Aa1Aa' })).toBe('')
  })

  it('用户名：空白/数字开头/非法字符/过短 → 提示', () => {
    expect(validateMemberCredential({ username: '   ', password: 'abc12345' })).toContain('用户名')
    expect(validateMemberCredential({ username: '1abc', password: 'abc12345' })).toContain('用户名')
    expect(validateMemberCredential({ username: 'ab-cd', password: 'abc12345' })).toContain('用户名')
    expect(validateMemberCredential({ username: 'abc', password: 'abc12345' })).toContain('用户名')
  })

  it('密码：空白/短于 8/长于 32/纯数字/纯字母 → 提示', () => {
    expect(validateMemberCredential({ username: 'abcd', password: '' })).toContain('密码')
    expect(validateMemberCredential({ username: 'abcd', password: 'abc1234' })).toContain('密码')
    expect(validateMemberCredential({ username: 'abcd', password: 'a1'.repeat(17) })).toContain('密码')
    expect(validateMemberCredential({ username: 'abcd', password: '12345678' })).toContain('字母')
    expect(validateMemberCredential({ username: 'abcd', password: 'abcdefgh' })).toContain('数字')
  })

  it('normalizeUsername 去除首尾空白', () => {
    expect(normalizeUsername('  Mall_User01 ')).toBe('Mall_User01')
  })
})
