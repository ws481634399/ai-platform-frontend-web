export interface RouteAccessInput {
  path: string
  fullPath: string
  isAuthenticated: boolean
  requiredPermission?: unknown
  hasPermission: (code: string) => boolean
}

export function resolveRouteAccess(input: RouteAccessInput) {
  if (input.path === '/login') return input.isAuthenticated ? '/' : true
  if (!input.isAuthenticated) {
    return { path: '/login', query: { redirect: input.fullPath } }
  }
  if (typeof input.requiredPermission === 'string' && !input.hasPermission(input.requiredPermission)) {
    return '/403'
  }
  return true
}
