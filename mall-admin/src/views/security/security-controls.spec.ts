import { beforeEach, describe, expect, it } from 'vitest'
import { resolveComponent } from '@/router/component-registry'
import { pinia } from '@/stores'
import { usePermissionStore } from '@/stores/permission'
import { applyPermission } from '@/directives/permission'
import adminUserViewSource from './AdminUserListView.vue?raw'
import roleViewSource from './RoleListView.vue?raw'
import menuViewSource from './MenuTreeView.vue?raw'

/**
 * RBAC 三页权限接线与只读边界守卫。
 *
 * 仓库未引入 @vue/test-utils/DOM 环境（既有视图测试均以纯逻辑模块 + 源码契约断言为准，
 * 见 product-editor.spec.ts / order-display.spec.ts），故这里对 SFC 做两处真实断言：
 * 1. v-permission 受控节点：指令在有权限/无权限下的真实隐藏行为（沿用 directives/permission.spec.ts 惯例）；
 * 2. 组件接线：component-registry 三键可解析；SFC 源码必须挂载约定权限码；菜单页不得出现编辑控件。
 */

const CONTROLLED_CODES = [
  'admin:create',
  'admin:update',
  'admin-role:assign',
  'role:create',
  'role:update',
  'role:delete',
  'role-permission:assign',
] as const

function fakeElement() {
  return {
    hidden: false,
    disabled: false,
    setAttribute: () => undefined,
  } as unknown as HTMLElement
}

beforeEach(() => {
  usePermissionStore(pinia).clear()
})

describe('v-permission 受控节点（RBAC 权限码）', () => {
  it('无权限时全部隐藏；bootstrap 授权后全部展示（含连字符权限码 admin-role:assign）', () => {
    const elements = CONTROLLED_CODES.map(() => fakeElement())

    elements.forEach((element, index) => {
      applyPermission(element, { value: CONTROLLED_CODES[index] } as never)
      expect(element.hidden).toBe(true)
    })

    usePermissionStore(pinia).applyBootstrap({
      user: { id: '1', username: 'super' },
      menus: [],
      permissions: [...CONTROLLED_CODES],
      permissionVersion: 1,
    })

    elements.forEach((element, index) => {
      applyPermission(element, { value: CONTROLLED_CODES[index] } as never)
      expect(element.hidden).toBe(false)
    })
  })

  it('页面查看权限码 admin:read/role:read/menu:read 由后端菜单挂载，未授权时代码同样隐藏', () => {
    const element = fakeElement()
    applyPermission(element, { value: 'admin:read' } as never)
    expect(element.hidden).toBe(true)
  })
})

describe('component-registry RBAC 三键', () => {
  it('SecurityAdmins/SecurityRoles/SecurityMenus 均可解析为懒加载组件', () => {
    expect(typeof resolveComponent('SecurityAdmins')).toBe('function')
    expect(typeof resolveComponent('SecurityRoles')).toBe('function')
    expect(typeof resolveComponent('SecurityMenus')).toBe('function')
  })
})

describe('SFC 权限码接线', () => {
  it('AdminUserListView 挂载 admin:create/admin:update/admin-role:assign 受控节点', () => {
    const source = adminUserViewSource
    expect(source).toContain(`v-permission="'admin:create'"`)
    expect(source).toContain(`v-permission="'admin:update'"`)
    expect(source).toContain(`v-permission="'admin-role:assign'"`)
  })

  it('RoleListView 挂载 role:create/role:update/role:delete/role-permission:assign 受控节点', () => {
    const source = roleViewSource
    expect(source).toContain(`v-permission="'role:create'"`)
    expect(source).toContain(`v-permission="'role:update'"`)
    expect(source).toContain(`v-permission="'role:delete'"`)
    expect(source).toContain(`v-permission="'role-permission:assign'"`)
  })
})

describe('MenuTreeView 只读边界', () => {
  it('渲染菜单树与权限点表格，且不存在任何编辑控件', () => {
    const source = menuViewSource
    expect(source).toContain('<el-tree')
    expect(source).toContain('data-testid="permission-table"')
    expect(source).toContain('permissionCode')
    expect(source).toContain('componentKey')

    // 只读页禁止出现编辑类控件/双向绑定/勾选树
    expect(source).not.toContain('<el-button')
    expect(source).not.toContain('<el-input')
    expect(source).not.toContain('<el-dialog')
    expect(source).not.toContain('<el-drawer')
    expect(source).not.toContain('<el-switch')
    expect(source).not.toContain('show-checkbox')
    expect(source).not.toContain('v-model')
  })
})
