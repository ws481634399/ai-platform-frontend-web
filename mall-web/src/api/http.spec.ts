import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { InternalAxiosRequestConfig } from 'axios'
import { AxiosError } from 'axios'

import http from './http'
import { memberAuthApi } from '@/api/auth'
import { clearSession } from '@/auth/clear-session'
import { pinia } from '@/stores'
import { useMemberStore } from '@/stores/member'

vi.mock('@/api/auth', () => ({
  memberAuthApi: {
    register: vi.fn(),
    login: vi.fn(),
    refresh: vi.fn(),
    logout: vi.fn(),
  },
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
  http.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
    const url = config.url ?? ''
    const attempt = (attempts.get(url) ?? 0) + 1
    attempts.set(url, attempt)
    const plan = plans.get(url) ?? { status: 200, retries: 0 }
    if (plan.status === 401 && attempt <= plan.retries + 1) {
      throw new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config, config, {
        status: 401,
        statusText: 'Unauthorized',
        headers: {},
        data: { success: false, code: 'UNAUTHORIZED', message: '请先登录', data: null },
        config,
      } as never)
    }
    const finalStatus = plan.status === 401 ? 200 : plan.status
    if (finalStatus >= 400) {
      throw new AxiosError('Request failed', 'ERR_BAD_REQUEST', config, config, {
        status: finalStatus,
        statusText: 'ERROR',
        headers: {},
        data: { success: false, code: 'ERROR', message: 'error', data: null },
        config,
      } as never)
    }
    return {
      data: { success: true, data: plan.body ?? {}, message: 'ok', traceId: null },
      status: finalStatus,
      statusText: finalStatus < 400 ? 'OK' : 'ERROR',
      headers: {},
      config,
    }
  }
}

const newPair = {
  accessToken: 'new-access',
  accessExpiresAt: '2026-09-15T18:00:00+08:00',
  refreshToken: 'new-refresh',
  memberId: '2099000000000000001',
}

describe('会员 401 集中刷新管线（STORY-003-01-01-02/TC-009、TC-010）', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useMemberStore(pinia).clear()
    delete (globalThis as { window?: unknown }).window
    resetAdapter()
  })

  it('TC-009 并发 3 个 401 仅触发一次 refresh，且三个原请求全部重放成功', async () => {
    useMemberStore(pinia).accessToken = 'old-access'
    vi.mocked(memberAuthApi.refresh).mockResolvedValue(newPair)
    plans.set('/api/mall/a', { status: 401, retries: 0 })
    plans.set('/api/mall/b', { status: 401, retries: 0 })
    plans.set('/api/mall/c', { status: 401, retries: 0 })

    const [a, b, c] = await Promise.all([
      http.get('/api/mall/a'),
      http.get('/api/mall/b'),
      http.get('/api/mall/c'),
    ])

    expect([a.status, b.status, c.status]).toEqual([200, 200, 200])
    expect(memberAuthApi.refresh).toHaveBeenCalledTimes(1)
    expect(attempts.get('/api/mall/a')).toBe(2)
    expect(attempts.get('/api/mall/b')).toBe(2)
    expect(attempts.get('/api/mall/c')).toBe(2)
    expect(useMemberStore(pinia).accessToken).toBe('new-access')
  })

  it('TC-010 refresh 也失败：全部等待者拒绝且仅执行一次集中清会话', async () => {
    useMemberStore(pinia).accessToken = 'old-access'
    ;(globalThis as { window?: unknown }).window = {}
    vi.mocked(memberAuthApi.refresh).mockRejectedValueOnce(new Error('refresh expired'))
    plans.set('/api/mall/a', { status: 401, retries: 0 })
    plans.set('/api/mall/b', { status: 401, retries: 0 })

    await expect(Promise.all([http.get('/api/mall/a'), http.get('/api/mall/b')])).rejects.toThrow()

    expect(memberAuthApi.refresh).toHaveBeenCalledTimes(1)
    // 清会话由真实 clearSession 执行（本文件中为 mock，其行为见 clear-session.spec.ts）
    expect(clearSession).toHaveBeenCalledTimes(1)
  })

  it('重放后仍 401 不形成刷新循环；/refresh 端点自身 401 不触发刷新', async () => {
    useMemberStore(pinia).accessToken = 'old-access'
    vi.mocked(memberAuthApi.refresh).mockResolvedValue(newPair)
    plans.set('/api/mall/loop', { status: 401, retries: 1 })
    plans.set('/api/auth/member/refresh', { status: 401, retries: 0 })

    await expect(http.get('/api/mall/loop')).rejects.toMatchObject({ response: { status: 401 } })
    await expect(http.post('/api/auth/member/refresh')).rejects.toMatchObject({
      response: { status: 401 },
    })

    expect(memberAuthApi.refresh).toHaveBeenCalledTimes(1)
    expect(attempts.get('/api/mall/loop')).toBe(2)
    expect(attempts.get('/api/auth/member/refresh')).toBe(1)
  })

  it('登录端点错误凭据 401 不触发 refresh', async () => {
    plans.set('/api/auth/member/login', { status: 401, retries: 0 })

    await expect(
      http.post('/api/auth/member/login', { username: 'malluser', password: 'wrong0000' }),
    ).rejects.toMatchObject({ response: { status: 401 } })

    expect(memberAuthApi.refresh).not.toHaveBeenCalled()
    expect(attempts.get('/api/auth/member/login')).toBe(1)
  })

  it('403 保持登录态，不刷新不清会话', async () => {
    const member = useMemberStore(pinia)
    member.accessToken = 'still-valid'
    plans.set('/api/mall/forbidden', { status: 403, retries: 0 })

    await expect(http.get('/api/mall/forbidden')).rejects.toMatchObject({
      response: { status: 403 },
    })

    expect(member.accessToken).toBe('still-valid')
    expect(memberAuthApi.refresh).not.toHaveBeenCalled()
    expect(clearSession).not.toHaveBeenCalled()
  })

  it('请求拦截器注入 Authorization 与 X-Trace-Id', async () => {
    useMemberStore(pinia).accessToken = 'bearer-token'
    const seenConfigs: InternalAxiosRequestConfig[] = []
    http.defaults.adapter = async (config) => {
      seenConfigs.push(config)
      return {
        data: { success: true, data: {}, message: 'ok', traceId: null },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      }
    }

    await http.get('/api/mall/ping')

    expect(seenConfigs[0].headers.get('Authorization')).toBe('Bearer bearer-token')
    expect(String(seenConfigs[0].headers.get('X-Trace-Id'))).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    )
  })
})
