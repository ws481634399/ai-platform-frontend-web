import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { AdminProfile, LoginRequest } from '@/types/auth'
import { authApi } from '@/api/auth'

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref<string>()
  const user = ref<AdminProfile>()
  const bootstrapState = ref<'idle' | 'loading' | 'ready' | 'error'>('idle')
  let restoreAttempted = false
  const isAuthenticated = computed(() => Boolean(accessToken.value))

  async function login(request: LoginRequest) {
    const pair = await authApi.login(request)
    accessToken.value = pair.accessToken
  }

  async function refresh() {
    const pair = await authApi.refresh()
    accessToken.value = pair.accessToken
    return pair.accessToken
  }

  async function logout() {
    try { await authApi.logout() } finally { clear() }
  }

  async function restore() {
    if (restoreAttempted || accessToken.value) return Boolean(accessToken.value)
    restoreAttempted = true
    try { await refresh(); return true } catch { return false }
  }

  function clear() {
    accessToken.value = undefined
    user.value = undefined
    bootstrapState.value = 'idle'
  }

  return { accessToken, user, bootstrapState, isAuthenticated, login, refresh, restore, logout, clear }
})
