import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { MemberCredentialRequest, MemberTokenPair } from '@/types/auth'
import type { MemberProfile, UpdateMemberProfileRequest } from '@/types/member'
import { memberAuthApi } from '@/api/auth'
import { memberApi } from '@/api/member'

/**
 * 会员登录态 Store（CHG-0016 / DU-FE-601；资料部分 DU-FE-602）。
 *
 * 存储策略与 mall-admin 对齐：accessToken 仅存内存（刷新页面后经 refresh cookie
 * 调 restore 恢复），refresh token 不下发 localStorage；memberId 为字符串雪花 ID。
 * profile 同样仅内存缓存，失败动作不污染缓存（由视图决定提示与重试）。
 */
export const useMemberStore = defineStore('member', () => {
  const accessToken = ref<string>()
  const memberId = ref<string>()
  const profile = ref<MemberProfile>()
  let restoreAttempted = false

  const isAuthenticated = computed(() => Boolean(accessToken.value))

  function applyPair(pair: MemberTokenPair) {
    accessToken.value = pair.accessToken
    memberId.value = pair.memberId
  }

  async function login(request: MemberCredentialRequest) {
    applyPair(await memberAuthApi.login(request))
  }

  async function refresh(): Promise<string> {
    const pair = await memberAuthApi.refresh()
    applyPair(pair)
    return pair.accessToken
  }

  async function logout() {
    try {
      await memberAuthApi.logout()
    } finally {
      clear()
    }
  }

  /**
   * 刷新页面后的会话恢复：access 已在内存直接放行；否则借 refresh cookie 试一次，
   * 失败保持游客态（整轮应用生命周期只尝试一次，避免每个守卫/请求重复打 refresh）。
   */
  async function restore(): Promise<boolean> {
    if (restoreAttempted || accessToken.value) return Boolean(accessToken.value)
    restoreAttempted = true
    try {
      await refresh()
      return true
    } catch {
      return false
    }
  }

  /** 拉取本人资料并写入缓存（GET /api/mall/members/me，memberId 只来自服务端视图）。 */
  async function fetchProfile(): Promise<MemberProfile> {
    const result = await memberApi.getProfile()
    profile.value = result
    return result
  }

  /** 保存资料：以服务端返回的最新视图整体替换缓存；接口失败时缓存保持不变。 */
  async function saveProfile(patch: UpdateMemberProfileRequest): Promise<MemberProfile> {
    const result = await memberApi.updateProfile(patch)
    profile.value = result
    return result
  }

  /** 上传头像：成功后同步缓存中的 avatarUrl；失败抛出由视图提示，旧头像/缓存不变。 */
  async function changeAvatar(file: File): Promise<string> {
    const result = await memberApi.uploadAvatar(file)
    if (profile.value) profile.value = { ...profile.value, avatarUrl: result.avatarUrl }
    return result.avatarUrl
  }

  function clear() {
    accessToken.value = undefined
    memberId.value = undefined
    profile.value = undefined
  }

  return {
    accessToken,
    memberId,
    profile,
    isAuthenticated,
    login,
    refresh,
    logout,
    restore,
    fetchProfile,
    saveProfile,
    changeAvatar,
    clear,
  }
})
