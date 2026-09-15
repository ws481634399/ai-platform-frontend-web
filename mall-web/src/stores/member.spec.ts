import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { memberAuthApi } from '@/api/auth'
import { useMemberStore } from './member'

vi.mock('@/api/auth', () => ({
  memberAuthApi: {
    register: vi.fn(),
    login: vi.fn(),
    refresh: vi.fn(),
    logout: vi.fn(),
  },
}))

const tokenPair = {
  accessToken: 'access-token',
  accessExpiresAt: '2026-09-15T18:00:00+08:00',
  refreshToken: 'refresh-token',
  memberId: '2099000000000000001',
}

describe('会员登录态 Store（STORY-003-01-01-02/TC-009）', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // 每例独立 pinia：restoreAttempted 是 store 闭包标志，需随 store 一起重建
    setActivePinia(createPinia())
  })

  it('login 保存 accessToken 与字符串 memberId；失败不残留脏态', async () => {
    const member = useMemberStore()
    vi.mocked(memberAuthApi.login).mockResolvedValue(tokenPair)

    await member.login({ username: 'malluser', password: 'abc12345' })
    expect(member.accessToken).toBe('access-token')
    expect(member.memberId).toBe('2099000000000000001')
    expect(member.isAuthenticated).toBe(true)

    member.clear()
    vi.mocked(memberAuthApi.login).mockRejectedValueOnce(new Error('bad credentials'))
    await expect(member.login({ username: 'malluser', password: 'wrong000' })).rejects.toThrow()
    expect(member.accessToken).toBeUndefined()
    expect(member.memberId).toBeUndefined()
  })

  it('restore 仅尝试一次：refresh 成功恢复；再次调用不重复请求', async () => {
    const member = useMemberStore()
    vi.mocked(memberAuthApi.refresh).mockResolvedValue(tokenPair)

    await expect(member.restore()).resolves.toBe(true)
    await expect(member.restore()).resolves.toBe(true)
    expect(memberAuthApi.refresh).toHaveBeenCalledTimes(1)
    expect(member.isAuthenticated).toBe(true)
  })

  it('restore：refresh 失败保持游客态；logout 无论接口成败都清态', async () => {
    const guest = useMemberStore()
    vi.mocked(memberAuthApi.refresh).mockRejectedValueOnce(new Error('refresh expired'))
    await expect(guest.restore()).resolves.toBe(false)
    expect(guest.isAuthenticated).toBe(false)

    guest.accessToken = 'still-there'
    guest.memberId = '1'
    // logout 接口失败时仍执行 finally 清态并向上抛出（与 mall-admin 惯例一致）
    vi.mocked(memberAuthApi.logout).mockRejectedValueOnce(new Error('network down'))
    await expect(guest.logout()).rejects.toThrow('network down')
    expect(memberAuthApi.logout).toHaveBeenCalledOnce()
    expect(guest.accessToken).toBeUndefined()
    expect(guest.memberId).toBeUndefined()
  })
})
