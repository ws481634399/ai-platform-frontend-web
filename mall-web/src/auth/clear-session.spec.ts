import { beforeEach, describe, expect, it, vi } from 'vitest'

import { clearSession } from './clear-session'
import { pinia } from '@/stores'
import { useMemberStore } from '@/stores/member'

describe('clearSession（STORY-003-01-01-02/TC-010）', () => {
  beforeEach(() => {
    useMemberStore(pinia).clear()
  })

  it('清空会员态并跳 /login?redirect=原路径', async () => {
    const member = useMemberStore(pinia)
    member.accessToken = 'expired-access'
    member.memberId = '2099000000000000001'
    const replace = vi.fn()
    const router = {
      currentRoute: { value: { path: '/orders', fullPath: '/orders?tab=unpaid' } },
      replace,
    } as never

    await clearSession(router)

    expect(member.isAuthenticated).toBe(false)
    expect(member.memberId).toBeUndefined()
    expect(replace).toHaveBeenCalledWith({ path: '/login', query: { redirect: '/orders?tab=unpaid' } })
  })

  it('已在 /login 时不重复跳转', async () => {
    const replace = vi.fn()
    const router = {
      currentRoute: { value: { path: '/login', fullPath: '/login' } },
      replace,
    } as never

    await clearSession(router)

    expect(replace).not.toHaveBeenCalled()
  })
})
