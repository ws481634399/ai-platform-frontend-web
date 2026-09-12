import type { Router } from 'vue-router'
import { pinia } from '@/stores'
import { useAuthStore } from '@/stores/auth'
import { usePermissionStore } from '@/stores/permission'
import { removeDynamicRoutes } from '@/router/dynamic-routes'

export async function clearSession(router?: Router): Promise<void> {
  useAuthStore(pinia).clear()
  usePermissionStore(pinia).clear()
  removeDynamicRoutes()
  if (router && router.currentRoute.value.path !== '/login') await router.replace('/login')
}
