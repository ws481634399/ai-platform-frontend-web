import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AxiosError } from 'axios'
import { extractSecurityMessage, securityApi } from './security'

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
}))

vi.mock('./http', () => ({
  default: {
    get: mocks.get,
    post: mocks.post,
    put: mocks.put,
    patch: mocks.patch,
    delete: mocks.delete,
  },
}))

function ok<T>(data: T): { data: { code: string; data: T } } {
  return { data: { code: '0', data } }
}

/** 构造带 UnifyResult 响应体的 axios 错误（对齐 http 拦截器透传形态） */
function apiError(status: number, message: string): AxiosError {
  return new AxiosError(
    message,
    String(status),
    undefined,
    undefined,
    { status, statusText: 'Error', headers: {}, config: {} as never, data: { code: 'B0409', message } },
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('securityApi - 管理员', () => {
  it('pageAdmins 携带 page/size 并解包 total+items（分页视图无 page/size 回显，items 含 roleIds）', async () => {
    const page = {
      total: 41,
      items: [
        { id: 1, username: 'root', status: 'ENABLED', authVersion: 3, permissionVersion: 9, roleIds: [1, 2] },
        { id: 2, username: 'ops', status: 'DISABLED', authVersion: 1, permissionVersion: 2, roleIds: [] },
      ],
    }
    mocks.get.mockResolvedValueOnce(ok(page))

    const result = await securityApi.pageAdmins(3, 20)

    expect(mocks.get).toHaveBeenCalledWith('/api/admin/security/admins', {
      params: { page: 3, size: 20 },
    })
    expect(result.total).toBe(41)
    expect(result.items).toHaveLength(2)
    expect(result.items[0]).toEqual({
      id: 1,
      username: 'root',
      status: 'ENABLED',
      authVersion: 3,
      permissionVersion: 9,
      roleIds: [1, 2],
    })
    // 无角色时 roleIds 为空数组而非 null
    expect(result.items[1]?.roleIds).toEqual([])
  })

  it('createAdmin 仅下发 username/password 两字段并解包 AdminView', async () => {
    mocks.post.mockResolvedValueOnce(
      ok({ id: 9, username: 'newbie', status: 'ENABLED', authVersion: 0, permissionVersion: 0 }),
    )

    const view = await securityApi.createAdmin({ username: 'newbie', password: 'StrongPass1' })

    expect(mocks.post).toHaveBeenCalledWith('/api/admin/security/admins', {
      username: 'newbie',
      password: 'StrongPass1',
    })
    expect(view.id).toBe(9)
    expect(view.status).toBe('ENABLED')
  })

  it('changeAdminStatus 走 PATCH /admins/{id}/status 并下发状态枚举', async () => {
    mocks.patch.mockResolvedValueOnce(ok(null))

    await securityApi.changeAdminStatus(7, 'DISABLED')

    expect(mocks.patch).toHaveBeenCalledWith('/api/admin/security/admins/7/status', {
      status: 'DISABLED',
    })
  })

  it('resetAdminPassword 走 PUT /admins/{id}/password', async () => {
    mocks.put.mockResolvedValueOnce(ok(null))

    await securityApi.resetAdminPassword(7, 'NewStrongPass1')

    expect(mocks.put).toHaveBeenNthCalledWith(1, '/api/admin/security/admins/7/password', {
      password: 'NewStrongPass1',
    })
  })

  it('replaceAdminRoles 请求体是裸 JSON 数组 number[]，不是对象', async () => {
    mocks.put.mockResolvedValueOnce(ok(null))

    await securityApi.replaceAdminRoles(7, [2, 3, 5])

    expect(mocks.put).toHaveBeenCalledTimes(1)
    const [url, body] = mocks.put.mock.calls[0]
    expect(url).toBe('/api/admin/security/admins/7/roles')
    // 裸 JSON 数组：是数组、无对象包装键、序列化后即 [2,3,5]
    expect(Array.isArray(body)).toBe(true)
    expect(body).not.toHaveProperty('roleIds')
    expect(body).not.toHaveProperty('targetId')
    expect(JSON.stringify(body)).toBe('[2,3,5]')
  })
})

describe('securityApi - 角色/菜单/权限点', () => {
  it('listRoles 解包 RoleView（id/code/name/description/status/builtIn/permissionIds/menuIds 八字段）', async () => {
    mocks.get.mockResolvedValueOnce(
      ok([
        {
          id: 1,
          code: 'SUPER_ADMIN',
          name: '超级管理员',
          description: null,
          status: 'ENABLED',
          builtIn: true,
          permissionIds: [11, 12],
          menuIds: [1, 20],
        },
      ]),
    )

    const roles = await securityApi.listRoles()

    expect(mocks.get).toHaveBeenCalledWith('/api/admin/security/roles')
    expect(roles[0]).toEqual({
      id: 1,
      code: 'SUPER_ADMIN',
      name: '超级管理员',
      description: null,
      status: 'ENABLED',
      builtIn: true,
      permissionIds: [11, 12],
      menuIds: [1, 20],
    })
  })

  it('createRole / updateRole / deleteRole 方法与请求体正确', async () => {
    mocks.post.mockResolvedValueOnce(ok(null))
    mocks.patch.mockResolvedValueOnce(ok(null))
    mocks.delete.mockResolvedValueOnce(ok(null))

    await securityApi.createRole({ code: 'OPS', name: '运维', description: '运维角色' })
    expect(mocks.post).toHaveBeenCalledWith('/api/admin/security/roles', {
      code: 'OPS',
      name: '运维',
      description: '运维角色',
    })

    await securityApi.updateRole(4, { name: '运维2', description: undefined, status: 'DISABLED' })
    expect(mocks.patch).toHaveBeenCalledWith('/api/admin/security/roles/4', {
      name: '运维2',
      description: undefined,
      status: 'DISABLED',
    })

    await securityApi.deleteRole(4)
    expect(mocks.delete).toHaveBeenCalledWith('/api/admin/security/roles/4')
  })

  it('listMenus / listPermissions 走对应 GET 端点', async () => {
    mocks.get.mockResolvedValueOnce(
      ok([
        {
          id: 1,
          parentId: null,
          name: '权限管理',
          type: 'DIRECTORY',
          path: '/security',
          componentKey: null,
          permissionCode: null,
          sortOrder: 90,
          visible: true,
          status: 'ENABLED',
        },
      ]),
    )
    mocks.get.mockResolvedValueOnce(
      ok([
        {
          id: 11,
          code: 'admin:create',
          name: '新建管理员',
          description: null,
          type: 'BUTTON',
          status: 'ENABLED',
          apiPattern: null,
          httpMethod: null,
        },
      ]),
    )

    const menus = await securityApi.listMenus()
    const permissions = await securityApi.listPermissions()

    expect(mocks.get).toHaveBeenNthCalledWith(1, '/api/admin/security/menus')
    expect(mocks.get).toHaveBeenNthCalledWith(2, '/api/admin/security/permissions')
    expect(menus[0]?.componentKey).toBeNull()
    expect(permissions[0]?.type).toBe('BUTTON')
  })

  it('replaceRoleAuthorizations 发送 targetId/permissionIds/menuIds 复合体（全集覆盖）', async () => {
    mocks.put.mockResolvedValueOnce(ok(null))

    await securityApi.replaceRoleAuthorizations({
      targetId: 4,
      permissionIds: [11, 12],
      menuIds: [1, 2, 3],
    })

    expect(mocks.put).toHaveBeenCalledWith('/api/admin/security/role-authorizations', {
      targetId: 4,
      permissionIds: [11, 12],
      menuIds: [1, 2, 3],
    })
  })
})

describe('extractSecurityMessage', () => {
  it('优先取 UnifyResult.message（如 409 用户名冲突）', () => {
    expect(extractSecurityMessage(apiError(409, 'username already exists'), '创建失败')).toBe(
      'username already exists',
    )
  })

  it('403 无消息体时给统一无权兜底', () => {
    const ex = new AxiosError(
      'Forbidden',
      '403',
      undefined,
      undefined,
      { status: 403, statusText: 'Forbidden', headers: {}, config: {} as never, data: {} },
    )
    expect(extractSecurityMessage(ex, '加载失败')).toBe('无权执行该操作（403）')
  })

  it('非 axios 错误与无响应错误回退兜底文案', () => {
    expect(extractSecurityMessage(new Error('boom'), '加载失败')).toBe('boom')
    expect(extractSecurityMessage('UNKNOWN', '加载失败')).toBe('加载失败')
  })
})
