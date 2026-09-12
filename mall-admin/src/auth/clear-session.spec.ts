import { beforeEach, describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import { pinia } from '@/stores'
import { registerDynamicRoutes } from '@/router/dynamic-routes'
import { useAuthStore } from '@/stores/auth'
import { usePermissionStore } from '@/stores/permission'
import { clearSession } from './clear-session'

describe('centralized session cleanup acceptance', () => {
  beforeEach(() => {
    useAuthStore(pinia).clear()
    usePermissionStore(pinia).clear()
  })

  it('STORY-001-03-03-03/TC-001..003 clears all state and dynamic routes idempotently', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/login', name: 'login', component: {} },
        { path: '/403', name: 'forbidden', component: {} },
      ],
    })
    await router.push('/403')
    const auth = useAuthStore(pinia)
    const permission = usePermissionStore(pinia)
    auth.accessToken = 'access-token'
    auth.user = { id: '1', username: 'platform-admin' }
    permission.applyBootstrap({
      user: auth.user,
      menus: [],
      permissions: ['admin:read'],
      permissionVersion: 2,
    })
    registerDynamicRoutes(router, [
      { id: 'workbench', name: '工作台', path: '/workbench', componentKey: 'Workbench', sortOrder: 0, visible: true },
    ])

    await clearSession(router)
    await clearSession(router)

    expect(auth.accessToken).toBeUndefined()
    expect(auth.user).toBeUndefined()
    expect(permission.permissions).toEqual([])
    expect(permission.menus).toEqual([])
    expect(permission.permissionVersion).toBe(0)
    expect(router.hasRoute('menu-workbench')).toBe(false)
    expect(router.currentRoute.value.path).toBe('/login')
  })
})
