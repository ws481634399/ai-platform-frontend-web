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
  // ancestors 为从根到当前节点的父级目录链，用于生成面包屑（目录本身无路由，仅展示标题）
  const visit = (menu: AdminMenu, ancestors: AdminMenu[] = []) => {
    if (menu.type !== 'DIRECTORY') {
      const breadcrumb = [
        ...ancestors.map((dir) => ({ title: dir.name })),
        { title: menu.name },
      ]
      const route: RouteRecordRaw = {
        path: menu.path,
        name: `menu-${menu.id}`,
        component: resolveComponent(menu.componentKey),
        meta: { title: menu.name, permission: menu.permissionCode, dynamic: true, breadcrumb },
      }
      // 挂到 AdminLayout 下（绝对路径子路由，Vue Router 4 支持），保证动态页带统一布局/页头
      removers.push(router.addRoute('admin-layout', route))
    }
    menu.children?.forEach((child) => visit(child, [...ancestors, menu]))
  }
  menus.filter((menu) => menu.visible).forEach((menu) => visit(menu))
}

export function removeDynamicRoutes() { removers.splice(0).forEach((remove) => remove()) }
