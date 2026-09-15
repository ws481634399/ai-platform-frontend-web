import { describe, expect, it } from 'vitest'
import { resolveMemberRouteAccess, safeRedirect } from './access-policy'

describe('会员路由访问策略（STORY-003-01-01-02/TC-010）', () => {
  it('未登录访问会员页 → /login 并保留 redirect 原路径（含 query）', () => {
    expect(
      resolveMemberRouteAccess({
        path: '/orders',
        fullPath: '/orders?tab=unpaid',
        isAuthenticated: false,
        requiresMember: true,
      }),
    ).toEqual({ path: '/login', query: { redirect: '/orders?tab=unpaid' } })
  })

  it('已登录访问会员页放行；公开页对游客放行', () => {
    expect(
      resolveMemberRouteAccess({
        path: '/orders',
        fullPath: '/orders',
        isAuthenticated: true,
        requiresMember: true,
      }),
    ).toBe(true)
    expect(
      resolveMemberRouteAccess({ path: '/', fullPath: '/', isAuthenticated: false }),
    ).toBe(true)
  })

  it('已登录会员访问 /login、/register → 回首页', () => {
    expect(
      resolveMemberRouteAccess({ path: '/login', fullPath: '/login', isAuthenticated: true }),
    ).toBe('/')
    expect(
      resolveMemberRouteAccess({ path: '/register', fullPath: '/register', isAuthenticated: true }),
    ).toBe('/')
  })
})

describe('safeRedirect（防开放重定向）', () => {
  it('同源相对路径原样返回', () => {
    expect(safeRedirect('/orders?tab=unpaid')).toBe('/orders?tab=unpaid')
    expect(safeRedirect('/')).toBe('/')
  })

  it('绝对 URL、协议相对、反斜杠变体、非字符串一律回首页', () => {
    expect(safeRedirect('https://evil.example.com')).toBe('/')
    expect(safeRedirect('//evil.example.com')).toBe('/')
    expect(safeRedirect('/\\evil.example.com')).toBe('/')
    expect(safeRedirect(undefined)).toBe('/')
    expect(safeRedirect(42)).toBe('/')
  })
})
