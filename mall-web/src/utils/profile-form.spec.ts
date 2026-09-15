import { describe, expect, it } from 'vitest'
import {
  AVATAR_MAX_BYTES,
  validateAvatarFile,
  validateProfileForm,
} from './profile-form'

describe('会员资料表单校验（STORY-003-01-02-01/TC-006，与后端 AC-017 对齐）', () => {
  const valid = { nickname: '商城小李', gender: 'MALE', phone: '13800138000', email: 'li@example.cn' }

  it('合法表单无错误', () => {
    expect(validateProfileForm(valid)).toEqual({})
  })

  it('昵称：空白/超长报错（1-32 字）', () => {
    expect(validateProfileForm({ ...valid, nickname: '   ' }).nickname).toBe('昵称不能为空')
    expect(validateProfileForm({ ...valid, nickname: 'a'.repeat(33) }).nickname).toContain('32')
    expect(validateProfileForm({ ...valid, nickname: 'a'.repeat(32) }).nickname).toBeUndefined()
  })

  it('手机：空串允许清空；非法号段/位数报错', () => {
    expect(validateProfileForm({ ...valid, phone: '' }).phone).toBeUndefined()
    expect(validateProfileForm({ ...valid, phone: '  ' }).phone).toBeUndefined()
    expect(validateProfileForm({ ...valid, phone: '12800138000' }).phone).toBe('手机号格式不正确')
    expect(validateProfileForm({ ...valid, phone: '1380013800' }).phone).toBe('手机号格式不正确')
  })

  it('邮箱：空串允许清空；非法格式/超 128 报错', () => {
    expect(validateProfileForm({ ...valid, email: '' }).email).toBeUndefined()
    expect(validateProfileForm({ ...valid, email: 'not-an-email' }).email).toBe('邮箱格式不正确')
    expect(validateProfileForm({ ...valid, email: `${'a'.repeat(123)}@b.cn` }).email).toBeUndefined()
    expect(validateProfileForm({ ...valid, email: `${'a'.repeat(124)}@b.cn` }).email).toBe(
      '邮箱格式不正确',
    )
  })

  it('性别：非枚举值报错（前端 select 约束之外的兜底）', () => {
    expect(validateProfileForm({ ...valid, gender: 'UNKNOWN' }).gender).toBeUndefined()
    expect(validateProfileForm({ ...valid, gender: 'FEMALE' }).gender).toBeUndefined()
    expect(validateProfileForm({ ...valid, gender: 'X' }).gender).toBe('性别取值非法')
  })
})

describe('头像文件前置校验（TC-006/AC-018）', () => {
  function fileWith(name: string, type: string, size: number): File {
    const file = new File(['x'], name, { type })
    Object.defineProperty(file, 'size', { value: size })
    return file
  }

  it('jpeg/png/webp 且 ≤2MB 通过', () => {
    expect(validateAvatarFile(fileWith('a.jpg', 'image/jpeg', 1024))).toBe('')
    expect(validateAvatarFile(fileWith('a.png', 'image/png', AVATAR_MAX_BYTES))).toBe('')
    expect(validateAvatarFile(fileWith('a.webp', 'image/webp', AVATAR_MAX_BYTES - 1))).toBe('')
  })

  it('非白名单类型（含伪装 gif）拒绝', () => {
    expect(validateAvatarFile(fileWith('a.gif', 'image/gif', 1024))).toContain('jpeg/png/webp')
    expect(validateAvatarFile(fileWith('a.png', 'application/octet-stream', 1024))).toContain(
      'jpeg/png/webp',
    )
  })

  it('超过 2MB 拒绝（与后端 FILE_TOO_LARGE 同界）', () => {
    expect(validateAvatarFile(fileWith('big.png', 'image/png', AVATAR_MAX_BYTES + 1))).toBe(
      '头像大小不能超过2MB',
    )
  })
})
