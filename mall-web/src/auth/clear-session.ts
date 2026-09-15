import type { Router } from 'vue-router'
import { pinia } from '@/stores'
import { useMemberStore } from '@/stores/member'

/**
 * 集中清会话（AC-015）：清空会员态并跳 /login?redirect=原路径。
 * 已在登录页时不重复跳转；redirect 落点的安全性由 safeRedirect 把关。
 */
export async function clearSession(router?: Router): Promise<void> {
  useMemberStore(pinia).clear()
  if (router) {
    const current = router.currentRoute.value
    if (current.path !== '/login') {
      await router.replace({ path: '/login', query: { redirect: current.fullPath } })
    }
  }
}
