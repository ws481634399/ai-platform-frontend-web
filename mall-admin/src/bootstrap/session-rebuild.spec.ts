import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import { pinia } from '@/stores'
import { useAuthStore } from '@/stores/auth'
import { usePermissionStore } from '@/stores/permission'
import { loadAdminSession } from '@/api/session'
import { bootstrapSession } from './session'

vi.mock('@/api/session', () => ({ loadAdminSession: vi.fn() }))
const router = () => createRouter({ history: createMemoryHistory(), routes: [] })

describe('session rebuild on browser refresh and permission upgrade (STORY-001-03-01-03)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore(pinia).clear()
    usePermissionStore(pinia).clear()
  })

  it('FE-303/TC-001 valid token refresh re-restores user, menus, permissions and dynamic routes', async () => {
    vi.mocked(loadAdminSession).mockResolvedValue({
      user: { id: '1', username: 'admin', displayName: 'Admin' },
      menus: [
        { id: 'wb', name: '工作台', path: '/workbench', componentKey: 'Workbench', sortOrder: 0, visible: true },
      ],
      permissions: ['wb:view'],
      permissionVersion: 2,
    })
    const active = router()

    await bootstrapSession(active)
    await bootstrapSession(active)

    expect(active.hasRoute('menu-wb')).toBe(true)
    expect(useAuthStore(pinia).user).toEqual({ id: '1', username: 'admin', displayName: 'Admin' })
    expect(usePermissionStore(pinia).menus).toHaveLength(1)
    expect(usePermissionStore(pinia).permissions).toEqual(['wb:view'])
    expect(useAuthStore(pinia).bootstrapState).toBe('ready')
  })

  it('FE-303/TC-002 same permission version repeated refresh does not duplicate routes or menus', async () => {
    vi.mocked(loadAdminSession).mockResolvedValue({
      user: { id: '1', username: 'admin' },
      menus: [
        { id: 'wb', name: '工作台', path: '/workbench', componentKey: 'Workbench', sortOrder: 0, visible: true },
      ],
      permissions: ['wb:view'],
      permissionVersion: 2,
    })
    const active = router()

    await bootstrapSession(active)
    await bootstrapSession(active)
    await bootstrapSession(active)

    const routeNames = active.getRoutes().filter((r) => r.name).map((r) => String(r.name))
    expect(routeNames.filter((name) => name === 'menu-wb')).toHaveLength(1)
    expect(usePermissionStore(pinia).menus).toHaveLength(1)
    expect(usePermissionStore(pinia).permissionVersion).toBe(2)
  })

  it('FE-303/TC-003 permission version upgrade removing a menu drops menu, permission and dynamic route', async () => {
    vi.mocked(loadAdminSession)
      .mockResolvedValueOnce({
        user: { id: '1', username: 'admin' },
        menus: [
          { id: 'wb', name: '工作台', path: '/workbench', componentKey: 'Workbench', sortOrder: 0, visible: true },
          { id: 'us', name: '用户', path: '/platform-users', componentKey: 'Users', sortOrder: 1, visible: true },
        ],
        permissions: ['wb:view', 'us:view'],
        permissionVersion: 2,
      })
      .mockResolvedValueOnce({
        user: { id: '1', username: 'admin' },
        menus: [
          { id: 'wb', name: '工作台', path: '/workbench', componentKey: 'Workbench', sortOrder: 0, visible: true },
        ],
        permissions: ['wb:view'],
        permissionVersion: 3,
      })
    const active = router()

    await bootstrapSession(active)
    expect(active.hasRoute('menu-us')).toBe(true)
    expect(usePermissionStore(pinia).has('us:view')).toBe(true)

    await bootstrapSession(active)

    expect(active.hasRoute('menu-us')).toBe(false)
    expect(usePermissionStore(pinia).has('us:view')).toBe(false)
    expect(usePermissionStore(pinia).menus.map((m) => m.id)).toEqual(['wb'])
    expect(usePermissionStore(pinia).permissionVersion).toBe(3)
    expect(active.hasRoute('menu-wb')).toBe(true)
  })
})