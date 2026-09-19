import type {
  AdminUserStatus,
  MenuNode,
  MenuType,
  PermissionNode,
  PermissionType,
  RbacStatus,
  RoleAuthorizationPayload,
} from '@/api/security'

/**
 * RBAC 管理台展示工具（CHG-0023 Story1）：纯函数，无框架依赖，便于单测。
 */

/** 带 children 的菜单树节点（仅前端构树用） */
export interface MenuTreeNode extends MenuNode {
  children: MenuTreeNode[]
}

/**
 * 按 parentId 将扁平菜单列表组为树：
 * - parentId 为 null 或父节点缺失（孤儿数据防御）时作为根节点；
 * - 每层按 sortOrder 升序、再按 id 升序排序。
 */
export function buildMenuTree(menus: MenuNode[]): MenuTreeNode[] {
  const nodes = new Map<number, MenuTreeNode>()
  menus.forEach((menu) => nodes.set(menu.id, { ...menu, children: [] }))

  const roots: MenuTreeNode[] = []
  nodes.forEach((node) => {
    const parent = node.parentId === null ? null : nodes.get(node.parentId)
    if (parent && parent !== node) parent.children.push(node)
    else roots.push(node)
  })

  const sortNodes = (list: MenuTreeNode[]): void => {
    list.sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id)
    list.forEach((child) => sortNodes(child.children))
  }
  sortNodes(roots)
  return roots
}

/** 权限点按 type 分组（BUTTON / API），组内按 code 排序 */
export function groupPermissionsByType(
  permissions: PermissionNode[],
): Record<PermissionType, PermissionNode[]> {
  const groups: Record<PermissionType, PermissionNode[]> = { BUTTON: [], API: [] }
  permissions.forEach((permission) => {
    groups[permission.type]?.push(permission)
  })
  groups.BUTTON.sort((a, b) => a.code.localeCompare(b.code))
  groups.API.sort((a, b) => a.code.localeCompare(b.code))
  return groups
}

/** 组装角色授权全量替换请求体（保存即全量覆盖，菜单/权限点均提交勾选全集） */
export function buildAuthorizationPayload(
  targetId: number,
  permissionIds: number[],
  menuIds: number[],
): RoleAuthorizationPayload {
  return { targetId, permissionIds: [...permissionIds], menuIds: [...menuIds] }
}

// ── 文案与标签样式 ──────────────────────────────────────────────

export function adminStatusLabel(status: AdminUserStatus): string {
  const labels: Record<AdminUserStatus, string> = {
    ENABLED: '启用',
    DISABLED: '禁用',
    LOCKED: '锁定',
  }
  return labels[status] ?? status
}

export function adminStatusTagType(
  status: AdminUserStatus,
): 'success' | 'info' | 'warning' {
  if (status === 'ENABLED') return 'success'
  if (status === 'LOCKED') return 'warning'
  return 'info'
}

export function rbacStatusLabel(status: RbacStatus): string {
  return status === 'ENABLED' ? '启用' : '禁用'
}

export function rbacStatusTagType(status: RbacStatus): 'success' | 'info' {
  return status === 'ENABLED' ? 'success' : 'info'
}

export function menuTypeLabel(type: MenuType): string {
  const labels: Record<MenuType, string> = {
    DIRECTORY: '目录',
    PAGE: '页面',
    ACTION: '操作',
  }
  return labels[type] ?? type
}

export function menuTypeTagType(type: MenuType): 'primary' | 'success' | 'warning' {
  if (type === 'DIRECTORY') return 'primary'
  if (type === 'PAGE') return 'success'
  return 'warning'
}

export function permissionTypeLabel(type: PermissionType): string {
  return type === 'BUTTON' ? '按钮' : '接口'
}

export function permissionTypeTagType(type: PermissionType): 'primary' | 'danger' {
  return type === 'BUTTON' ? 'primary' : 'danger'
}
