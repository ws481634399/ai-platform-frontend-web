import { describe, expect, it } from 'vitest'
import type { MenuNode, PermissionNode } from '@/api/security'
import {
  adminStatusLabel,
  adminStatusTagType,
  buildAuthorizationPayload,
  buildMenuTree,
  groupPermissionsByType,
  menuTypeLabel,
  permissionTypeLabel,
  rbacStatusLabel,
  type MenuTreeNode,
} from './security-display'

function menu(partial: Partial<MenuNode> & Pick<MenuNode, 'id' | 'name' | 'type'>): MenuNode {
  return {
    parentId: null,
    path: null,
    componentKey: null,
    permissionCode: null,
    sortOrder: 0,
    visible: true,
    status: 'ENABLED',
    ...partial,
  }
}

function permission(partial: Partial<PermissionNode> & Pick<PermissionNode, 'id' | 'code' | 'name' | 'type'>): PermissionNode {
  return {
    description: null,
    status: 'ENABLED',
    apiPattern: null,
    httpMethod: null,
    ...partial,
  }
}

describe('buildMenuTree', () => {
  it('按 parentId 组树，同层按 sortOrder 再按 id 排序', () => {
    const menus = [
      menu({ id: 21, parentId: 2, name: '角色管理', type: 'PAGE', sortOrder: 20, path: '/security/roles', componentKey: 'SecurityRoles' }),
      menu({ id: 1, name: '商品', type: 'DIRECTORY', sortOrder: 10, path: '/product' }),
      menu({ id: 22, parentId: 2, name: '菜单权限', type: 'PAGE', sortOrder: 30, path: '/security/menus', componentKey: 'SecurityMenus' }),
      menu({ id: 2, name: '权限管理', type: 'DIRECTORY', sortOrder: 90, path: '/security' }),
      menu({ id: 20, parentId: 2, name: '管理员管理', type: 'PAGE', sortOrder: 10, path: '/security/admins', componentKey: 'SecurityAdmins' }),
      menu({ id: 99, parentId: 2, name: '权限管理操作', type: 'ACTION', sortOrder: 10, permissionCode: 'role:create' }),
    ]

    const tree = buildMenuTree(menus)

    // 根层 sortOrder：商品(10) < 权限管理(90)
    expect(tree.map((node) => node.id)).toEqual([1, 2])
    // 子层 sortOrder=10 时再按 id：20 < 99，随后 21、22
    expect((tree[1] as MenuTreeNode).children.map((node) => node.id)).toEqual([20, 99, 21, 22])
  })

  it('parentId 指向不存在节点（孤儿数据）时作为根节点兜底', () => {
    const tree = buildMenuTree([
      menu({ id: 5, parentId: 999, name: '孤儿页面', type: 'PAGE', path: '/orphan', componentKey: 'X' }),
    ])
    expect(tree.map((node) => node.id)).toEqual([5])
    expect(tree[0]?.children).toEqual([])
  })
})

describe('groupPermissionsByType', () => {
  it('按 BUTTON/API 分组且组内按 code 排序', () => {
    const groups = groupPermissionsByType([
      permission({ id: 2, code: 'role:delete', name: '删除角色', type: 'BUTTON' }),
      permission({ id: 1, code: 'admin:create', name: '新建管理员', type: 'BUTTON' }),
      permission({ id: 3, code: 'GET /brands', name: '品牌查询', type: 'API', httpMethod: 'GET', apiPattern: '/api/admin/brands' }),
    ])

    expect(groups.BUTTON.map((item) => item.code)).toEqual(['admin:create', 'role:delete'])
    expect(groups.API.map((item) => item.id)).toEqual([3])
  })
})

describe('buildAuthorizationPayload', () => {
  it('组装 targetId/permissionIds/menuIds 全集且对入参数组做拷贝', () => {
    const permissionIds = [11, 12]
    const menuIds = [1, 2]
    const payload = buildAuthorizationPayload(7, permissionIds, menuIds)

    expect(payload).toEqual({ targetId: 7, permissionIds: [11, 12], menuIds: [1, 2] })

    permissionIds.push(13)
    expect(payload.permissionIds).toEqual([11, 12])
  })
})

describe('RBAC 文案映射', () => {
  it('管理员/角色/菜单/权限枚举均有中文文案与 tag 类型', () => {
    expect(adminStatusLabel('ENABLED')).toBe('启用')
    expect(adminStatusLabel('DISABLED')).toBe('禁用')
    expect(adminStatusLabel('LOCKED')).toBe('锁定')
    expect(adminStatusTagType('LOCKED')).toBe('warning')
    expect(rbacStatusLabel('DISABLED')).toBe('禁用')
    expect(menuTypeLabel('DIRECTORY')).toBe('目录')
    expect(menuTypeLabel('PAGE')).toBe('页面')
    expect(menuTypeLabel('ACTION')).toBe('操作')
    expect(permissionTypeLabel('API')).toBe('接口')
  })
})
