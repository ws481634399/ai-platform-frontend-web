import type { Router } from 'vue-router'
import { pinia } from '@/stores'
import { useAuthStore } from '@/stores/auth'
import { usePermissionStore } from '@/stores/permission'
import { removeDynamicRoutes } from '@/router/dynamic-routes'

export function clearSession(router?: Router) {
  useAuthStore(pinia).clear()
  usePermissionStore(pinia).clear()
  removeDynamicRoutes()
  if (router && router.currentRoute.value.path !== '/login') void router.replace('/login')
}
