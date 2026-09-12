import { describe, expect, it } from 'vitest'

import { resolveRouteAccess } from './access-policy'

describe('route access acceptance', () => {
  it('STORY-001-03-02-03/TC-001..003 preserves redirect, separates 403, and allows 404 matching', () => {
    expect(resolveRouteAccess({
      path: '/settings',
      fullPath: '/settings?tab=security',
      isAuthenticated: false,
      hasPermission: () => false,
    })).toEqual({ path: '/login', query: { redirect: '/settings?tab=security' } })

    expect(resolveRouteAccess({
      path: '/settings',
      fullPath: '/settings',
      isAuthenticated: true,
      requiredPermission: 'settings:read',
      hasPermission: () => false,
    })).toBe('/403')

    expect(resolveRouteAccess({
      path: '/unknown',
      fullPath: '/unknown',
      isAuthenticated: true,
      hasPermission: () => true,
    })).toBe(true)
  })
})
