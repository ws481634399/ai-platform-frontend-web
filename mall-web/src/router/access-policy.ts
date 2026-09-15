/**
 * 会员路由访问策略（纯函数，便于单测；CHG-0016 / DU-FE-601）。
 */
export interface MemberRouteAccessInput {
  path: string
  fullPath: string
  isAuthenticated: boolean
  requiresMember?: boolean
}

export type MemberRouteAccessDecision = true | string | { path: string; query: { redirect: string } }

const GUEST_PATHS = new Set(['/login', '/register'])

export function resolveMemberRouteAccess(input: MemberRouteAccessInput): MemberRouteAccessDecision {
  // 游客页：已登录会员再访问登录/注册 → 回首页
  if (GUEST_PATHS.has(input.path)) return input.isAuthenticated ? '/' : true
  // 会员页：未登录（含 restore 失败）→ 登录并保留回跳目标
  if (input.requiresMember === true && !input.isAuthenticated) {
    return { path: '/login', query: { redirect: input.fullPath } }
  }
  return true
}

/**
 * 回跳地址白名单（AC-015 防开放重定向）：仅接受同源相对路径，
 * 拒绝协议相对（//host）、反斜杠变体（/\host）与绝对 URL；非法值一律回首页。
 */
export function safeRedirect(target: unknown): string {
  if (typeof target !== 'string') return '/'
  if (!target.startsWith('/')) return '/'
  if (target.startsWith('//') || target.startsWith('/\\')) return '/'
  return target
}
