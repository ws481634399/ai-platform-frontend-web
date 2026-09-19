import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useSecurityStore } from './security'

const mocks = vi.hoisted(() => ({
  pageAdmins: vi.fn(),
  listRoles: vi.fn(),
  listMenus: vi.fn(),
  listPermissions: vi.fn(),
}))

vi.mock('@/api/security', () => ({
  securityApi: {
    pageAdmins: mocks.pageAdmins,
    listRoles: mocks.listRoles,
    listMenus: mocks.listMenus,
    listPermissions: mocks.listPermissions,
  },
  // 与真实 extractSecurityMessage 同构的最小实现：优先 UnifyResult.message
  extractSecurityMessage: (
    ex: { response?: { data?: { message?: string } }; message?: string },
    fallback: string,
  ) => ex?.response?.data?.message || ex?.message || fallback,
}))

function adminRow(id: number, username: string, status: 'ENABLED' | 'DISABLED' | 'LOCKED' = 'ENABLED') {
  return { id, username, status, authVersion: 1, permissionVersion: 1, roleIds: [] }
}

beforeEach(() => {
  vi.clearAllMocks()
  setActivePinia(createPinia())
})

describe('security store - 管理员分页与当前页本地过滤', () => {
  it('loadAdmins 携带当前 page/size，落库 items/total', async () => {
    mocks.pageAdmins.mockResolvedValueOnce({ total: 41, items: [adminRow(1, 'root')] })
    const store = useSecurityStore()
    store.adminPage = 3
    store.adminSize = 20

    await store.loadAdmins()

    expect(mocks.pageAdmins).toHaveBeenCalledWith(3, 20)
    expect(store.adminTotal).toBe(41)
    expect(store.admins).toEqual([adminRow(1, 'root')])
    expect(store.filteredAdmins).toHaveLength(1)
    expect(store.adminsLoadError).toBeNull()
  })

  it('用户名/状态过滤只作用当前页且不发请求', async () => {
    mocks.pageAdmins.mockResolvedValueOnce({
      total: 4,
      items: [
        adminRow(1, 'alice', 'ENABLED'),
        adminRow(2, 'bob', 'DISABLED'),
        adminRow(3, 'calvin', 'ENABLED'),
        adminRow(4, 'Alicia', 'LOCKED'),
      ],
    })
    const store = useSecurityStore()
    await store.loadAdmins()
    expect(mocks.pageAdmins).toHaveBeenCalledTimes(1)

    // 用户名关键字（大小写不敏感，当前页包含匹配）
    store.adminKeyword = 'ali'
    expect(store.filteredAdmins.map((row) => row.id)).toEqual([1, 4])
    // 叠加状态过滤
    store.adminStatusFilter = 'ENABLED'
    expect(store.filteredAdmins.map((row) => row.id)).toEqual([1])
    // 仅状态过滤
    store.adminKeyword = ''
    expect(store.filteredAdmins.map((row) => row.id)).toEqual([1, 3])
    // 重置
    store.resetAdminFilters()
    expect(store.filteredAdmins).toHaveLength(4)

    // 整个过滤过程没有发起任何额外请求
    expect(mocks.pageAdmins).toHaveBeenCalledTimes(1)
  })

  it('加载失败时记录后端 message 到 adminsLoadError 且不清空旧数据', async () => {
    mocks.pageAdmins
      .mockResolvedValueOnce({ total: 1, items: [adminRow(1, 'root')] })
      .mockRejectedValueOnce({ response: { data: { message: '服务暂不可用' } } })
    const store = useSecurityStore()
    await store.loadAdmins()

    await store.loadAdmins()

    expect(store.adminsLoadError).toBe('服务暂不可用')
    expect(store.admins).toEqual([adminRow(1, 'root')])
    expect(store.adminsLoading).toBe(false)
  })
})

describe('security store - 角色/菜单/权限点加载缓存', () => {
  it('loadRoles 默认只请求一次，force=true 强制刷新', async () => {
    mocks.listRoles.mockResolvedValue([
      {
        id: 1,
        code: 'SUPER_ADMIN',
        name: '超管',
        description: null,
        status: 'ENABLED',
        builtIn: true,
        permissionIds: [11],
        menuIds: [1],
      },
    ])
    const store = useSecurityStore()

    await store.loadRoles()
    await store.loadRoles()
    expect(mocks.listRoles).toHaveBeenCalledTimes(1)
    expect(store.roles).toHaveLength(1)

    await store.loadRoles(true)
    expect(mocks.listRoles).toHaveBeenCalledTimes(2)
    expect(store.rolesLoadError).toBeNull()
  })

  it('loadMenus/loadPermissions 各自落库；失败暴露 message', async () => {
    mocks.listMenus.mockResolvedValue([
      { id: 1, parentId: null, name: '权限管理', type: 'DIRECTORY', path: '/security', componentKey: null, permissionCode: null, sortOrder: 90, visible: true, status: 'ENABLED' },
    ])
    mocks.listPermissions.mockRejectedValueOnce({ response: { data: { message: '无权查看权限点' } } })
    const store = useSecurityStore()

    await Promise.allSettled([store.loadMenus(), store.loadPermissions()])

    expect(store.menus).toHaveLength(1)
    expect(store.menusLoadError).toBeNull()
    expect(store.permissions).toEqual([])
    expect(store.permissionsLoadError).toBe('无权查看权限点')
  })
})
