import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AxiosRequestConfig } from 'axios'
import { AxiosError } from 'axios'

import http from './http'
import { authApi } from '@/api/auth'
import { clearSession } from '@/auth/clear-session'
import { pinia } from '@/stores'
import { useAuthStore } from '@/stores/auth'
import { usePermissionStore } from '@/stores/permission'

vi.mock('@/api/auth', () => ({
  authApi: { login: vi.fn(), refresh: vi.fn(), logout: vi.fn() },
}))
vi.mock('@/auth/clear-session', () => ({ clearSession: vi.fn() }))
vi.mock('@/router', () => ({ router: {} }))

interface Plan {
  status: number
  retries: number
  body?: unknown
}

const plans = new Map<string, Plan>()
const attempts = new Map<string, number>()

function resetAdapter() {
  plans.clear()
  attempts.clear()
  http.defaults.adapter = async (config: AxiosRequestConfig) => {
    const url = config.url ?? ''
    const attempt = (attempts.get(url) ?? 0) + 1
    attempts.set(url, attempt)
    const plan = plans.get(url) ?? { status: 200, retries: 0 }
    if (plan.status === 401 && attempt <= plan.retries + 1) {
      throw new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config, config, {
        status: 401, statusText: 'Unauthorized', headers: {}, data: {}, config,
      } as never)
    }
    const finalStatus = plan.status === 401 ? 200 : plan.status
    if (finalStatus >= 400) {
      throw new AxiosError('Request failed', 'ERR_BAD_REQUEST', config, config, {
        status: finalStatus, statusText: 'ERROR', headers: {}, data: {}, config,
      } as never)
    }
    return {
      data: { success: finalStatus < 400, data: plan.body ?? {}, message: 'ok', traceId: null },
      status: finalStatus,
      statusText: finalStatus < 400 ? 'OK' : 'ERROR',
      headers: {},
      config,
    }
  }
}

describe('centralized 401 refresh pipeline (STORY-001-03-03-02/STORY-001-03-01-01)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore(pinia).clear()
    usePermissionStore(pinia).clear()
    delete (globalThis as { window?: unknown }).window
    resetAdapter()
  })

  it('FE-308/TC-001 multiple concurrent 401s trigger one refresh and replay each request once', async () => {
    useAuthStore(pinia).accessToken = 'old-access'
    vi.mocked(authApi.refresh).mockResolvedValue({
      accessToken: 'new-access',
      accessExpiresAt: '2026-09-12T18:00:00+08:00',
      refreshExpiresAt: '2026-09-19T18:00:00+08:00',
    })
    plans.set('/api/data/a', { status: 401, retries: 0 })
    plans.set('/api/data/b', { status: 401, retries: 0 })

    const [a, b] = await Promise.all([http.get('/api/data/a'), http.get('/api/data/b')])

    expect(a.status).toBe(200)
    expect(b.status).toBe(200)
    expect(authApi.refresh).toHaveBeenCalledTimes(1)
    expect(attempts.get('/api/data/a')).toBe(2)
    expect(attempts.get('/api/data/b')).toBe(2)
    expect(useAuthStore(pinia).accessToken).toBe('new-access')
  })

  it('FE-308/TC-002 refresh failure rejects all waiters and performs exactly one cleanup', async () => {
    useAuthStore(pinia).accessToken = 'old-access'
    ;(globalThis as { window?: unknown }).window = {}
    vi.mocked(authApi.refresh).mockRejectedValueOnce(new Error('refresh expired'))
    plans.set('/api/data/a', { status: 401, retries: 0 })
    plans.set('/api/data/b', { status: 401, retries: 0 })

    await expect(Promise.all([http.get('/api/data/a'), http.get('/api/data/b')])).rejects.toThrow()

    expect(authApi.refresh).toHaveBeenCalledTimes(1)
    expect(clearSession).toHaveBeenCalledTimes(1)
  })

  it('FE-308/TC-003 replayed 401 or refresh-endpoint 401 does not loop', async () => {
    useAuthStore(pinia).accessToken = 'old-access'
    vi.mocked(authApi.refresh).mockResolvedValue({
      accessToken: 'new-access',
      accessExpiresAt: '2026-09-12T18:00:00+08:00',
      refreshExpiresAt: '2026-09-19T18:00:00+08:00',
    })
    plans.set('/api/data/loop', { status: 401, retries: 1 })
    plans.set('/api/admin/auth/refresh', { status: 401, retries: 0 })

    await expect(http.get('/api/data/loop')).rejects.toMatchObject({ response: { status: 401 } })
    await expect(http.get('/api/admin/auth/refresh')).rejects.toMatchObject({ response: { status: 401 } })

    expect(authApi.refresh).toHaveBeenCalledTimes(1)
    expect(attempts.get('/api/data/loop')).toBe(2)
    expect(attempts.get('/api/admin/auth/refresh')).toBe(1)
  })

  it('FE-301/TC-002 bootstrap 401 flows into centralized session cleanup', async () => {
    useAuthStore(pinia).accessToken = 'old-access'
    ;(globalThis as { window?: unknown }).window = {}
    vi.mocked(authApi.refresh).mockRejectedValueOnce(new Error('refresh expired'))
    plans.set('/api/admin/session/bootstrap', { status: 401, retries: 0 })

    await expect(http.get('/api/admin/session/bootstrap')).rejects.toThrow()

    expect(clearSession).toHaveBeenCalledTimes(1)
  })

  it('FE-309/TC-002 a 403 preserves authentication and never starts refresh or cleanup', async () => {
    const auth = useAuthStore(pinia)
    auth.accessToken = 'still-valid'
    plans.set('/api/admin/forbidden', { status: 403, retries: 0 })

    await expect(http.get('/api/admin/forbidden')).rejects.toMatchObject({ response: { status: 403 } })

    expect(auth.accessToken).toBe('still-valid')
    expect(authApi.refresh).not.toHaveBeenCalled()
    expect(clearSession).not.toHaveBeenCalled()
  })
})
