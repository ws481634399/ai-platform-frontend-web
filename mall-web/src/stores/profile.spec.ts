import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { memberApi } from '@/api/member'
import { useMemberStore } from './member'
import type { MemberProfile } from '@/types/member'

vi.mock('@/api/member', () => ({
  memberApi: {
    getProfile: vi.fn(),
    updateProfile: vi.fn(),
    uploadAvatar: vi.fn(),
  },
}))

const profileView: MemberProfile = {
  memberId: '72001111',
  username: 'malluser',
  nickname: '会员011111',
  avatarUrl: null,
  gender: 'UNKNOWN',
  phone: null,
  email: null,
}

describe('会员资料 Store（STORY-003-01-02-01/TC-006）', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
  })

  it('fetchProfile 拉取并缓存资料（memberId 仅来自服务端视图）', async () => {
    const member = useMemberStore()
    vi.mocked(memberApi.getProfile).mockResolvedValueOnce(profileView)

    const result = await member.fetchProfile()
    expect(result).toEqual(profileView)
    expect(member.profile?.memberId).toBe('72001111')
    expect(memberApi.getProfile).toHaveBeenCalledOnce()
  })

  it('saveProfile 成功以服务端视图整体替换缓存；失败不污染缓存', async () => {
    const member = useMemberStore()
    vi.mocked(memberApi.getProfile).mockResolvedValueOnce(profileView)
    await member.fetchProfile()

    const updated = { ...profileView, nickname: '新昵称', gender: 'FEMALE' as const }
    vi.mocked(memberApi.updateProfile).mockResolvedValueOnce(updated)
    await member.saveProfile({ nickname: '新昵称', gender: 'FEMALE' })
    expect(memberApi.updateProfile).toHaveBeenCalledWith({ nickname: '新昵称', gender: 'FEMALE' })
    expect(member.profile?.nickname).toBe('新昵称')
    expect(member.profile?.gender).toBe('FEMALE')

    vi.mocked(memberApi.updateProfile).mockRejectedValueOnce(new Error('400 bad'))
    await expect(member.saveProfile({ nickname: '不应落缓存' })).rejects.toThrow('400 bad')
    expect(member.profile?.nickname).toBe('新昵称')
  })

  it('changeAvatar 成功同步缓存 avatarUrl；失败保留旧头像', async () => {
    const member = useMemberStore()
    vi.mocked(memberApi.getProfile).mockResolvedValueOnce({ ...profileView, avatarUrl: 'http://old' })
    await member.fetchProfile()

    const file = new File(['png'], 'a.png', { type: 'image/png' })
    vi.mocked(memberApi.uploadAvatar).mockResolvedValueOnce({ avatarUrl: 'http://new' })
    await expect(member.changeAvatar(file)).resolves.toBe('http://new')
    expect(memberApi.uploadAvatar).toHaveBeenCalledWith(file)
    expect(member.profile?.avatarUrl).toBe('http://new')

    vi.mocked(memberApi.uploadAvatar).mockRejectedValueOnce(new Error('503 storage'))
    await expect(member.changeAvatar(file)).rejects.toThrow('503 storage')
    expect(member.profile?.avatarUrl).toBe('http://new')
  })

  it('缓存为空时 changeAvatar 仍可返回 URL 且不构造脏 profile；clear 清资料', async () => {
    const member = useMemberStore()
    vi.mocked(memberApi.uploadAvatar).mockResolvedValueOnce({ avatarUrl: 'http://x' })
    await expect(member.changeAvatar(new File(['x'], 'a.jpg', { type: 'image/jpeg' }))).resolves.toBe(
      'http://x',
    )
    expect(member.profile).toBeUndefined()

    vi.mocked(memberApi.getProfile).mockResolvedValueOnce(profileView)
    await member.fetchProfile()
    member.clear()
    expect(member.profile).toBeUndefined()
    expect(member.memberId).toBeUndefined()
  })
})
