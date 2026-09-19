import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AxiosError } from 'axios'
import { createPinia, setActivePinia } from 'pinia'
import { useRoles } from './use-roles'
import type { RoleRow } from '@/api/security'

const mocks = vi.hoisted(() => ({
  listRoles: vi.fn(),
  createRole: vi.fn(),
  updateRole: vi.fn(),
  deleteRole: vi.fn(),
  listMenus: vi.fn(),
  listPermissions: vi.fn(),
  replaceRoleAuthorizations: vi.fn(),
  messageSuccess: vi.fn(),
  messageError: vi.fn(),
  confirm: vi.fn(),
}))

vi.mock('@/api/security', () => ({
  securityApi: {
    listRoles: mocks.listRoles,
    createRole: mocks.createRole,
    updateRole: mocks.updateRole,
    deleteRole: mocks.deleteRole,
    listMenus: mocks.listMenus,
    listPermissions: mocks.listPermissions,
    replaceRoleAuthorizations: mocks.replaceRoleAuthorizations,
  },
  extractSecurityMessage: (
    ex: { response?: { data?: { message?: string } }; message?: string },
    fallback: string,
  ) => ex?.response?.data?.message || ex?.message || fallback,
}))

vi.mock('element-plus', () => ({
  ElMessage: { success: mocks.messageSuccess, error: mocks.messageError },
  ElMessageBox: { confirm: mocks.confirm },
}))

function role(
  id: number,
  code: string,
  status: RoleRow['status'] = 'ENABLED',
  builtIn = false,
  menuIds: number[] = [],
  permissionIds: number[] = [],
): RoleRow {
  return { id, code, name: `${code}-名称`, description: '角色描述', status, builtIn, menuIds, permissionIds }
}

function badRequest(message: string): AxiosError {
  return new AxiosError(
    message,
    '400',
    undefined,
    undefined,
    { status: 400, statusText: 'Bad', headers: {}, config: {} as never, data: { code: 'B0400', message } },
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  setActivePinia(createPinia())
})

describe('角色页 - 新建/编辑回显与提交', () => {
  it('openEdit 按行回显 name/description/status/code（code 禁改），提交走 PATCH', async () => {
    mocks.updateRole.mockResolvedValue(undefined)
    mocks.listRoles.mockResolvedValue([])
    const vm = useRoles()

    vm.openEdit(role(4, 'OPS', 'DISABLED'))

    expect(vm.isEditing()).toBe(true)
    expect(vm.form.code).toBe('OPS')
    expect(vm.form.name).toBe('OPS-名称')
    expect(vm.form.description).toBe('角色描述')
    expect(vm.form.status).toBe('DISABLED')

    vm.form.name = '运维改名'
    await vm.submitForm()

    expect(mocks.updateRole).toHaveBeenCalledWith(4, {
      name: '运维改名',
      description: '角色描述',
      status: 'DISABLED',
    })
    expect(mocks.createRole).not.toHaveBeenCalled()
    expect(vm.dialogVisible.value).toBe(false)
  })

  it('openCreate 提交走 POST（不下发 status）；空名称前端拦截', async () => {
    mocks.createRole.mockResolvedValue(undefined)
    mocks.listRoles.mockResolvedValue([])
    const vm = useRoles()

    vm.openCreate()
    expect(vm.isEditing()).toBe(false)
    await vm.submitForm()
    expect(vm.dialogError.value).toBe('角色名称不能为空')
    expect(mocks.createRole).not.toHaveBeenCalled()

    vm.form.code = '  AUDITOR  '
    vm.form.name = '  审计员  '
    vm.form.description = '   '
    await vm.submitForm()

    expect(mocks.createRole).toHaveBeenCalledWith({
      code: 'AUDITOR',
      name: '审计员',
      description: undefined,
    })
    expect(mocks.messageSuccess).toHaveBeenCalledWith('角色创建成功')
  })
})

describe('角色页 - 删除', () => {
  it('取消不删除；确认后 DELETE 并强制刷新列表', async () => {
    mocks.deleteRole.mockResolvedValue(undefined)
    mocks.listRoles.mockResolvedValue([])
    const vm = useRoles()

    mocks.confirm.mockRejectedValueOnce(new Error('cancel'))
    await vm.remove(role(7, 'OPS'))
    expect(mocks.deleteRole).not.toHaveBeenCalled()

    mocks.confirm.mockResolvedValueOnce(true)
    await vm.remove(role(7, 'OPS'))
    expect(mocks.deleteRole).toHaveBeenCalledWith(7)
    expect(mocks.messageSuccess).toHaveBeenCalledWith('角色已删除')
    expect(mocks.listRoles).toHaveBeenCalled()
  })
})

describe('角色页 - 权限分配抽屉', () => {
  it('打开时按 GET /roles 出参 menuIds/permissionIds 回显树与权限点初始勾选', async () => {
    mocks.listMenus.mockResolvedValue([
      { id: 1, parentId: null, name: '权限管理', type: 'DIRECTORY', path: '/security', componentKey: null, permissionCode: null, sortOrder: 90, visible: true, status: 'ENABLED' },
      { id: 20, parentId: 1, name: '管理员管理', type: 'PAGE', path: '/security/admins', componentKey: 'SecurityAdmins', permissionCode: 'admin:read', sortOrder: 10, visible: true, status: 'ENABLED' },
    ])
    mocks.listPermissions.mockResolvedValue([
      { id: 11, code: 'admin:create', name: '新建管理员', description: null, type: 'BUTTON', status: 'ENABLED', apiPattern: null, httpMethod: null },
      { id: 12, code: 'admin:update', name: '编辑管理员', description: null, type: 'BUTTON', status: 'ENABLED', apiPattern: null, httpMethod: null },
    ])
    const vm = useRoles()

    // 角色行携带当前授权：菜单 1/20、权限点 11
    await vm.openAuthorization(role(4, 'OPS', 'ENABLED', false, [1, 20], [11]))

    expect(mocks.listMenus).toHaveBeenCalledTimes(1)
    expect(mocks.listPermissions).toHaveBeenCalledTimes(1)
    expect(vm.drawerVisible.value).toBe(true)
    expect(vm.authRole.value?.id).toBe(4)
    // 回显勾选来自 GET /roles 出参，不再是空勾选
    expect(vm.checkedMenuIds.value).toEqual([1, 20])
    expect(vm.checkedPermissionIds.value).toEqual([11])
    // 菜单树已按 parentId 组装
    expect(vm.menuTree.value.map((node) => node.id)).toEqual([1])
    expect(vm.menuTree.value[0]?.children.map((node) => node.id)).toEqual([20])
    // 权限点按 type 分组、组内按 code 排序
    expect(vm.permissionGroups.value.BUTTON.map((item) => item.id)).toEqual([11, 12])
  })

  it('角色 menuIds/permissionIds 均为空数组（无授权）时初始无勾选，且不污染原行', async () => {
    mocks.listMenus.mockResolvedValue([])
    mocks.listPermissions.mockResolvedValue([])
    const vm = useRoles()
    const target = role(6, 'AUDITOR')

    await vm.openAuthorization(target)

    expect(vm.checkedMenuIds.value).toEqual([])
    expect(vm.checkedPermissionIds.value).toEqual([])
    // 回显使用拷贝：后续勾选编辑不应反向改动角色行
    vm.checkedMenuIds.value.push(9)
    vm.checkedPermissionIds.value.push(8)
    expect(target.menuIds).toEqual([])
    expect(target.permissionIds).toEqual([])
  })

  it('保存提交勾选全集 {targetId,permissionIds,menuIds}，成功后关闭并刷新', async () => {
    mocks.listMenus.mockResolvedValue([])
    mocks.listPermissions.mockResolvedValue([])
    mocks.replaceRoleAuthorizations.mockResolvedValue(undefined)
    mocks.listRoles.mockResolvedValue([])
    const vm = useRoles()
    await vm.openAuthorization(role(4, 'OPS'))

    // 模拟 el-tree 勾选同步（测试环境无树实例，collectCheckedMenuIds 回退状态数组）
    vm.checkedMenuIds.value = [1, 20]
    vm.checkedPermissionIds.value = [11, 12]

    await vm.submitAuthorization()

    expect(mocks.replaceRoleAuthorizations).toHaveBeenCalledWith({
      targetId: 4,
      permissionIds: [11, 12],
      menuIds: [1, 20],
    })
    expect(vm.drawerVisible.value).toBe(false)
    expect(mocks.messageSuccess).toHaveBeenCalledWith('权限分配已保存（全量覆盖）')
    // 成功后强制刷新角色列表（store.loadRoles(true) 绕过缓存 → api listRoles 再调一次）
    expect(mocks.listRoles).toHaveBeenCalledTimes(1)
  })

  it('保存失败（勾选停用资源 400）保留抽屉、勾选与后端错误文案', async () => {
    mocks.listMenus.mockResolvedValue([])
    mocks.listPermissions.mockResolvedValue([])
    mocks.replaceRoleAuthorizations.mockRejectedValueOnce(
      badRequest('menu set contains missing or disabled resource'),
    )
    const vm = useRoles()
    await vm.openAuthorization(role(4, 'OPS'))
    vm.checkedMenuIds.value = [99]

    await vm.submitAuthorization()

    expect(vm.drawerVisible.value).toBe(true)
    expect(vm.checkedMenuIds.value).toEqual([99])
    expect(vm.drawerError.value).toBe('menu set contains missing or disabled resource')
  })
})
