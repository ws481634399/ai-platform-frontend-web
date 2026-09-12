import type { Router, RouteRecordRaw } from 'vue-router'
import type { AdminMenu } from '@/types/auth'
import { resolveComponent } from './component-registry'

const removers: Array<() => void> = []
function validPath(path: string) { return path.startsWith('/') && !path.startsWith('//') && !path.includes('://') }

export function validateDynamicRoutes(menus: AdminMenu[]) {
  const ids = new Set<string>()
  const visit = (menu: AdminMenu) => {
    if (ids.has(menu.id)) throw new Error(`Duplicate menu id: ${menu.id}`)
    ids.add(menu.id)
    if (menu.type !== 'DIRECTORY' && !validPath(menu.path)) throw new Error(`Unsafe menu path: ${menu.path}`)
    if (menu.type !== 'DIRECTORY') resolveComponent(menu.componentKey)
    menu.children?.forEach(visit)
  }
  menus.forEach(visit)
}

export function registerDynamicRoutes(router: Router, menus: AdminMenu[]) {
  validateDynamicRoutes(menus)
  removeDynamicRoutes()
  const visit = (menu: AdminMenu) => {
    if (menu.type !== 'DIRECTORY') {
      const route: RouteRecordRaw = {
        path: menu.path,
        name: `menu-${menu.id}`,
        component: resolveComponent(menu.componentKey),
        meta: { title: menu.name, permission: menu.permissionCode, dynamic: true },
      }
      removers.push(router.addRoute(route))
    }
    menu.children?.forEach(visit)
  }
  menus.filter((menu) => menu.visible).forEach(visit)
}

export function removeDynamicRoutes() { removers.splice(0).forEach((remove) => remove()) }
