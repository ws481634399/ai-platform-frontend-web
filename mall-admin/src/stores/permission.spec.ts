import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { usePermissionStore } from './permission'

describe('permission store', () => {
  beforeEach(() => setActivePinia(createPinia()))
  it('STORY-001-03-01-03/TC-001..003 replaces versioned permissions without retaining removed codes', () => {
    const store = usePermissionStore()
    store.applyBootstrap({
      user: { id: '1', username: 'admin' }, menus: [],
      permissions: ['admin:read', 'admin:read'], permissionVersion: 2,
    })
    expect(store.permissions).toEqual(['admin:read'])
    expect(store.has('admin:read')).toBe(true)
    expect(store.has('admin:write')).toBe(false)
    store.applyBootstrap({
      user: { id: '1', username: 'admin' }, menus: [],
      permissions: ['admin:write'], permissionVersion: 3,
    })
    expect(store.has('admin:read')).toBe(false)
    expect(store.has('admin:write')).toBe(true)
    expect(store.permissionVersion).toBe(3)
  })
  it('STORY-001-03-02-01/TC-001..003 filters visibility, empty directories, and sorts safe text', () => {
    const store = usePermissionStore()
    store.applyBootstrap({ user: { id: '1', username: 'admin' }, permissions: [], permissionVersion: 3, menus: [
      { id: '3', name: '<b>safe text</b>', type: 'PAGE', path: '/c', componentKey: 'Workbench', sortOrder: 1, visible: true },
      { id: '1', name: 'first', type: 'PAGE', path: '/a', componentKey: 'Workbench', sortOrder: 1, visible: true },
      { id: '2', name: 'hidden', type: 'PAGE', path: '/b', componentKey: 'Workbench', sortOrder: 0, visible: false },
      { id: '4', name: 'empty', type: 'DIRECTORY', path: '', componentKey: '', sortOrder: 0, visible: true, children: [] },
    ] })
    expect(store.menus.map((menu) => menu.id)).toEqual(['1', '3'])
    expect(store.menus[1]?.name).toBe('<b>safe text</b>')

    store.applyBootstrap({ user: { id: '2', username: 'limited' }, permissions: [], permissionVersion: 4, menus: [
      { id: '5', name: 'orders only', type: 'PAGE', path: '/orders', componentKey: 'Workbench', sortOrder: 0, visible: true },
    ] })
    expect(store.menus.map((menu) => menu.id)).toEqual(['5'])
    expect(store.menus.some((menu) => menu.id === '1' || menu.id === '3')).toBe(false)
  })
})
