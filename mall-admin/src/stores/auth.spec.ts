import { beforeEach, describe, expect, it, vi } from 'vitest'

import { authApi } from '@/api/auth'
import { pinia } from '@/stores'
import { useAuthStore } from './auth'

vi.mock('@/api/auth', () => ({
  authApi: {
    login: vi.fn(),
    refresh: vi.fn(),
    logout: vi.fn(),
  },
}))

describe('administrator authentication acceptance', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore(pinia).clear()
  })

  it('STORY-001-01-04-01/TC-001..003 authenticates atomically, preserves failure safety, and logs out', async () => {
    const auth = useAuthStore(pinia)
    vi.mocked(authApi.login).mockResolvedValue({
      accessToken: 'access-token',
      accessExpiresAt: '2026-09-12T18:00:00+08:00',
      refreshExpiresAt: '2026-09-19T18:00:00+08:00',
    })

    await auth.login({ username: 'platform-admin', password: 'StrongPassword1' })
    expect(auth.accessToken).toBe('access-token')
    expect(auth.isAuthenticated).toBe(true)

    auth.clear()
    vi.mocked(authApi.login).mockRejectedValueOnce(new Error('invalid credentials'))
    await expect(auth.login({ username: 'platform-admin', password: 'WrongPassword1' })).rejects.toThrow()
    expect(auth.accessToken).toBeUndefined()
    expect(auth.user).toBeUndefined()

    auth.accessToken = 'access-token'
    auth.user = { id: '1', username: 'platform-admin' }
    await auth.logout()
    expect(authApi.logout).toHaveBeenCalledOnce()
    expect(auth.accessToken).toBeUndefined()
    expect(auth.user).toBeUndefined()
  })
})
