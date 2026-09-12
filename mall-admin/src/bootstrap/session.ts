import { pinia } from '@/stores'
import { useAuthStore } from '@/stores/auth'
import { usePermissionStore } from '@/stores/permission'
import { loadAdminSession } from '@/api/session'
import { registerDynamicRoutes, validateDynamicRoutes } from '@/router/dynamic-routes'
import type { Router } from 'vue-router'

let activeBootstrap: Promise<void> | undefined

export function bootstrapSession(router: Router): Promise<void> {
  if (!activeBootstrap) {
    activeBootstrap = (async () => {
      const auth = useAuthStore(pinia)
      auth.bootstrapState = 'loading'
      try {
        const snapshot = await loadAdminSession()
        validateDynamicRoutes(snapshot.menus)
        registerDynamicRoutes(router, snapshot.menus)
        usePermissionStore(pinia).applyBootstrap(snapshot)
        auth.user = snapshot.user
        auth.bootstrapState = 'ready'
      } catch (error) {
        auth.bootstrapState = 'error'
        throw error
      }
    })().finally(() => { activeBootstrap = undefined })
  }
  return activeBootstrap
}
