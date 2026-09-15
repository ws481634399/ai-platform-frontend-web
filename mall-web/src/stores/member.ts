import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { MemberCredentialRequest, MemberTokenPair } from '@/types/auth'
import { memberAuthApi } from '@/api/auth'

/**
 * 会员登录态 Store（CHG-0016 / DU-FE-601）。
 *
 * 存储策略与 mall-admin 对齐：accessToken 仅存内存（刷新页面后经 refresh cookie
 * 调 restore 恢复），refresh token 不下发 localStorage；memberId 为字符串雪花 ID。
 */
export const useMemberStore = defineStore('member', () => {
  const accessToken = ref<string>()
  const memberId = ref<string>()
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

  function clear() {
    accessToken.value = undefined
    memberId.value = undefined
  }

  return { accessToken, memberId, isAuthenticated, login, refresh, logout, restore, clear }
})
