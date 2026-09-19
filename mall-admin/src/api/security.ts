import axios from 'axios'
import type { AxiosError } from 'axios'
import http from './http'
import type { ApiResponse } from '@/types'

/**
 * RBAC 管理台 API（M5 CHG-0023 Story1 / DU-FE-701）。
 *
 * 网关前缀：/api/admin/security（mall-identity RbacAdminController / AdminUserController）。
 * 所有响应包 UnifyResult，这里统一解包 data；错误时由调用方通过 extractSecurityMessage 取后端 message。
 *
 * 字段来源（已逐字段核对后端 record，禁止猜测）：
 * - 管理员分页行：AdminUserQuery.Summary(long id, String username, String status, long authVersion, long permissionVersion, List<Long> roleIds)
 * - 管理员分页视图：AdminUserApplicationService.Page(long total, List<Summary> items)（注意：不回显 page/size）
 * - 创建管理员响应：AdminUserApplicationService.AdminView(id, username, status, authVersion, permissionVersion)（创建响应仍不含 roleIds）
 * - 角色视图：RbacAdministrationApplicationService.RoleView(id, code, name, description, status, builtIn, List<Long> permissionIds, List<Long> menuIds)
 * - 菜单视图：RbacAdministrationApplicationService.MenuView(id, parentId, name, type, path, componentKey, permissionCode, sortOrder, visible, status)
 * - 权限视图：RbacAdministrationApplicationService.PermissionView(id, code, name, description, type, status, apiPattern, httpMethod)
 *
 * 回显与提交语义：
 * - GET /admins items[].roleIds 为管理员当前角色 ID 列表（无角色为空数组，非 null），
 *   GET /roles [].menuIds / permissionIds 为角色当前授权（空数组表示无授权），
 *   「分配角色」对话框与「权限分配」抽屉打开时直接用这些字段回显勾选。
 * - 保存仍为全量覆盖语义（PUT /admins/{id}/roles 发裸 number[]；PUT /role-authorizations 发复合体），
 *   后端未提供增量增删端点。
 */

/** 管理员状态（对齐后端 domain AdminUserStatus：ENABLED / DISABLED / LOCKED） */
export type AdminUserStatus = 'ENABLED' | 'DISABLED' | 'LOCKED'

/** 角色/菜单/权限启用状态（对齐后端 domain RbacStatus：ENABLED / DISABLED） */
export type RbacStatus = 'ENABLED' | 'DISABLED'

/** 菜单类型（对齐后端 Menu.MenuType：DIRECTORY / PAGE / ACTION） */
export type MenuType = 'DIRECTORY' | 'PAGE' | 'ACTION'

/** 权限点类型（对齐后端 Permission.PermissionType：BUTTON / API） */
export type PermissionType = 'BUTTON' | 'API'

/** 管理员分页行（对齐 AdminUserQuery.Summary；roleIds 为当前角色 ID，无角色为空数组而非 null） */
export interface AdminRow {
  id: number
  username: string
  status: AdminUserStatus
  authVersion: number
  permissionVersion: number
  roleIds: number[]
}

/** 管理员分页视图（对齐 AdminUserApplicationService.Page：仅 total + items） */
export interface AdminPage {
  total: number
  items: AdminRow[]
}

/** 创建管理员响应（对齐 AdminUserApplicationService.AdminView） */
export interface AdminView {
  id: number
  username: string
  status: AdminUserStatus
  authVersion: number
  permissionVersion: number
}

/** 创建管理员请求体（AdminUserController.CreateRequest：仅两字段） */
export interface CreateAdminPayload {
  username: string
  password: string
}

/** 角色行（对齐 RoleView；permissionIds/menuIds 为角色当前授权，空数组表示无授权） */
export interface RoleRow {
  id: number
  code: string
  name: string
  description: string | null
  status: RbacStatus
  builtIn: boolean
  permissionIds: number[]
  menuIds: number[]
}

/** 新建角色请求体（RbacAdminController.RoleRequest） */
export interface CreateRolePayload {
  code: string
  name: string
  description?: string
}

/** 编辑角色请求体（RbacAdminController.RoleUpdate：code 不可改） */
export interface UpdateRolePayload {
  name: string
  description?: string
  status: RbacStatus
}

/** 菜单行（对齐 MenuView；DIRECTORY 的 path/componentKey 可为空） */
export interface MenuNode {
  id: number
  parentId: number | null
  name: string
  type: MenuType
  path: string | null
  componentKey: string | null
  permissionCode: string | null
  sortOrder: number
  visible: boolean
  status: RbacStatus
}

/** 权限点行（对齐 PermissionView；BUTTON 类型 apiPattern/httpMethod 通常为空） */
export interface PermissionNode {
  id: number
  code: string
  name: string
  description: string | null
  type: PermissionType
  status: RbacStatus
  apiPattern: string | null
  httpMethod: string | null
}

/** 角色授权全量替换请求体（RbacAdminController.AuthorizationAssignment） */
export interface RoleAuthorizationPayload {
  targetId: number
  permissionIds: number[]
  menuIds: number[]
}

function unwrap<T>(response: { data: ApiResponse<T> }): T {
  return response.data.data
}

export const securityApi = {
  // ── 管理员 ───────────────────────────────────────────────────
  /** 分页查询管理员（后端仅支持 page/size，无服务端搜索） */
  async pageAdmins(page: number, size: number): Promise<AdminPage> {
    return unwrap(await http.get('/api/admin/security/admins', { params: { page, size } }))
  },

  /** 创建管理员（用户名 + 初始密码，成功返回 AdminView） */
  async createAdmin(payload: CreateAdminPayload): Promise<AdminView> {
    return unwrap(await http.post('/api/admin/security/admins', payload))
  },

  /** 启用/禁用/锁定管理员（实际仅切换 ENABLED/DISABLED） */
  async changeAdminStatus(id: number, status: AdminUserStatus): Promise<void> {
    await http.patch(`/api/admin/security/admins/${id}/status`, { status })
  },

  /** 重置管理员密码 */
  async resetAdminPassword(id: number, password: string): Promise<void> {
    await http.put(`/api/admin/security/admins/${id}/password`, { password })
  },

  /**
   * 全量替换管理员角色。
   * 注意请求体是裸 JSON 数组 number[]（RbacAdminController 以 List<Long> 直接接参，不是对象）。
   */
  async replaceAdminRoles(id: number, roleIds: number[]): Promise<void> {
    await http.put(`/api/admin/security/admins/${id}/roles`, roleIds)
  },

  // ── 角色 ─────────────────────────────────────────────────────
  async listRoles(): Promise<RoleRow[]> {
    return unwrap(await http.get('/api/admin/security/roles'))
  },

  async createRole(payload: CreateRolePayload): Promise<void> {
    await http.post('/api/admin/security/roles', payload)
  },

  async updateRole(id: number, payload: UpdateRolePayload): Promise<void> {
    await http.patch(`/api/admin/security/roles/${id}`, payload)
  },

  async deleteRole(id: number): Promise<void> {
    await http.delete(`/api/admin/security/roles/${id}`)
  },

  // ── 菜单 / 权限点 ────────────────────────────────────────────
  async listMenus(): Promise<MenuNode[]> {
    return unwrap(await http.get('/api/admin/security/menus'))
  },

  async listPermissions(): Promise<PermissionNode[]> {
    return unwrap(await http.get('/api/admin/security/permissions'))
  },

  /**
   * 全量替换角色授权（菜单 + 权限点一次覆盖）。
   * 端点权限码 role-permission:assign。
   */
  async replaceRoleAuthorizations(payload: RoleAuthorizationPayload): Promise<void> {
    await http.put('/api/admin/security/role-authorizations', payload)
  },
}

/**
 * 提取安全域错误文案：优先 UnifyResult.message（如 409 用户名冲突、内置角色不可删），
 * 其次 axios message，最后兜底文案；403 给统一无权提示。
 */
export function extractSecurityMessage(ex: unknown, fallback: string): string {
  if (axios.isAxiosError(ex)) {
    const data = (ex as AxiosError<ApiResponse>).response?.data
    if (data?.message) return data.message
    if ((ex as AxiosError).response?.status === 403) return '无权执行该操作（403）'
    return ex.message || fallback
  }
  if (ex instanceof Error && ex.message) return ex.message
  return fallback
}
