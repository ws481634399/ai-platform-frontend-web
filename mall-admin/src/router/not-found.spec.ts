import { describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import { resolveRouteAccess } from './access-policy'

describe('catch-all 404 routing (STORY-001-03-02-03/TC-003)', () => {
  it('FE-306/TC-003 access to an unknown path flows through a value-returning guard into the 404 route', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/login', name: 'login', component: {} },
        { path: '/403', name: 'forbidden', component: {} },
        {
          path: '/',
          component: {},
          children: [
            { path: 'dashboard', name: 'dashboard', component: {} },
            { path: ':pathMatch(.*)*', name: 'not-found', component: {} },
          ],
        },
      ],
    })
    const fullPath = '/unknown-page'
    const decision = resolveRouteAccess({
      path: fullPath,
      fullPath,
      isAuthenticated: true,
      hasPermission: () => true,
    })
    expect(decision).toBe(true)

    await router.push(fullPath)
    await router.isReady()
    expect(router.currentRoute.value.name).toBe('not-found')
    expect(router.currentRoute.value.path).toBe('/unknown-page')
  })
})