import http from './http'
import type { ApiResponse } from '@/types'
import type { AvatarUploadResult, MemberProfile, UpdateMemberProfileRequest } from '@/types/member'

function unwrap<T>(response: { data: ApiResponse<T> }): T {
  return response.data.data
}

/**
 * 会员资料 API（CHG-0016 STORY-003-01-02-01；端点经网关 8080 路由至 member 8102）。
 *
 * 头像上传为 multipart/form-data，part 名固定为 file（对齐后端 @RequestPart("file")）；
 * 浏览器环境下交给 axios 自动生成带 boundary 的 Content-Type，禁止手动设置。
 */
export const memberApi = {
  async getProfile(): Promise<MemberProfile> {
    return unwrap<MemberProfile>(await http.get('/api/mall/members/me'))
  },

  async updateProfile(request: UpdateMemberProfileRequest): Promise<MemberProfile> {
    return unwrap<MemberProfile>(await http.put('/api/mall/members/me', request))
  },

  async uploadAvatar(file: File): Promise<AvatarUploadResult> {
    const form = new FormData()
    form.append('file', file)
    return unwrap<AvatarUploadResult>(
      await http.post('/api/mall/members/me/avatar', form, {
        // 2MB 上限 + multipart 编码开销，留 30s 余量
        timeout: 30_000,
      }),
    )
  },
}
