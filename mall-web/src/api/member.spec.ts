import { beforeEach, describe, expect, it, vi } from 'vitest'

const httpMocks = vi.hoisted(() => ({
  get: vi.fn(),
  put: vi.fn(),
  post: vi.fn(),
}))

vi.mock('@/api/http', () => ({ default: httpMocks }))

import { memberApi } from './member'

function envelope<T>(data: T) {
  return {
    data: { success: true, code: '0', message: 'ok', traceId: 't', data },
  }
}

describe('会员资料 API（STORY-003-01-02-01 契约）', () => {
  beforeEach(() => vi.clearAllMocks())

  it('getProfile 命中 GET /api/mall/members/me 并解包 data', async () => {
    httpMocks.get.mockResolvedValueOnce(
      envelope({
        memberId: '72001111',
        username: 'malluser',
        nickname: '会员011111',
        avatarUrl: null,
        gender: 'UNKNOWN',
        phone: null,
        email: null,
      }),
    )
    const profile = await memberApi.getProfile()
    expect(httpMocks.get).toHaveBeenCalledWith('/api/mall/members/me')
    expect(profile.memberId).toBe('72001111')
    expect(profile.avatarUrl).toBeNull()
  })

  it('updateProfile 以 PUT 提交部分更新体', async () => {
    httpMocks.put.mockResolvedValueOnce(envelope({ memberId: '72001111' }))
    await memberApi.updateProfile({ nickname: '新昵称', phone: '' })
    expect(httpMocks.put).toHaveBeenCalledWith('/api/mall/members/me', {
      nickname: '新昵称',
      phone: '',
    })
  })

  it('uploadAvatar 以 multipart FormData 提交，part 名固定 file，超时放宽至 30s', async () => {
    httpMocks.post.mockResolvedValueOnce(envelope({ avatarUrl: 'http://minio/member-avatar/x.png' }))
    const file = new File(['bytes'], 'avatar.png', { type: 'image/png' })

    const result = await memberApi.uploadAvatar(file)

    expect(result.avatarUrl).toBe('http://minio/member-avatar/x.png')
    expect(httpMocks.post).toHaveBeenCalledOnce()
    const [url, form, config] = httpMocks.post.mock.calls[0]
    expect(url).toBe('/api/mall/members/me/avatar')
    expect(form).toBeInstanceOf(FormData)
    expect((form as FormData).get('file')).toBe(file)
    expect(config.timeout).toBe(30_000)
  })
})
