import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AxiosError } from 'axios'
import { createPinia, setActivePinia } from 'pinia'
import { useAdminUsers } from './use-admin-users'
import type { AdminRow } from '@/api/security'

const mocks = vi.hoisted(() => ({
  pageAdmins: vi.fn(),
  createAdmin: vi.fn(),
  changeAdminStatus: vi.fn(),
  resetAdminPassword: vi.fn(),
  replaceAdminRoles: vi.fn(),
  listRoles: vi.fn(),
  messageSuccess: vi.fn(),
  messageError: vi.fn(),
  confirm: vi.fn(),
}))

vi.mock('@/api/security', () => ({
  securityApi: {
    pageAdmins: mocks.pageAdmins,
    createAdmin: mocks.createAdmin,
    changeAdminStatus: mocks.changeAdminStatus,
    resetAdminPassword: mocks.resetAdminPassword,
    replaceAdminRoles: mocks.replaceAdminRoles,
    listRoles: mocks.listRoles,
  },
  extractSecurityMessage: (
    ex: { response?: { status?: number; data?: { message?: string } }; message?: string },
    fallback: string,
  ) => {
    if (ex?.response?.status === 403 && !ex.response.data?.message) return '无权执行该操作（403）'
    return ex?.response?.data?.message || ex?.message || fallback
  },
}))

vi.mock('element-plus', () => ({
  ElMessage: { success: mocks.messageSuccess, error: mocks.messageError },
  ElMessageBox: { confirm: mocks.confirm },
}))

function admin(
  id: number,
  username: string,
  status: AdminRow['status'] = 'ENABLED',
  roleIds: number[] = [],
): AdminRow {
  return { id, username, status, authVersion: 1, permissionVersion: 1, roleIds }
}

function conflictError(message: string): AxiosError {
  return new AxiosError(
    message,
    '409',
    undefined,
    undefined,
    { status: 409, statusText: 'Conflict', headers: {}, config: {} as never, data: { code: 'B0409', message } },
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  setActivePinia(createPinia())
})

describe('管理员页 - 分页渲染', () => {
  it('store.loadAdmins 拉取的分页行经 filteredAdmins 渲染到表格', async () => {
    mocks.pageAdmins.mockResolvedValueOnce({ total: 2, items: [admin(1, 'root'), admin(2, 'ops')] })
    const vm = useAdminUsers()

    await vm.store.loadAdmins()

    expect(mocks.pageAdmins).toHaveBeenCalledWith(1, 20)
    expect(vm.store.filteredAdmins.map((row) => row.username)).toEqual(['root', 'ops'])
  })
})

describe('管理员页 - 新建', () => {
  it('提交仅含 username/password，成功后关闭对话框、提示并刷新当前页', async () => {
    mocks.createAdmin.mockResolvedValueOnce({
      id: 9,
      username: 'newbie',
      status: 'ENABLED',
      authVersion: 0,
      permissionVersion: 0,
    })
    const vm = useAdminUsers()
    vm.openCreate()
    vm.createForm.username = '  newbie  '
    vm.createForm.password = 'StrongPass1'

    await vm.submitCreate()

    expect(mocks.createAdmin).toHaveBeenCalledWith({ username: 'newbie', password: 'StrongPass1' })
    expect(vm.createVisible.value).toBe(false)
    expect(mocks.messageSuccess).toHaveBeenCalledWith('管理员创建成功，可继续为其分配角色')
    expect(mocks.pageAdmins).toHaveBeenCalledTimes(1)
  })

  it('409 用户名冲突时展示后端 message，对话框与已填内容保留', async () => {
    mocks.createAdmin.mockRejectedValueOnce(conflictError('username already exists'))
    const vm = useAdminUsers()
    vm.openCreate()
    vm.createForm.username = 'dupe'
    vm.createForm.password = 'StrongPass1'

    await vm.submitCreate()

    expect(vm.createVisible.value).toBe(true)
    expect(vm.createError.value).toBe('username already exists')
    expect(vm.createForm.username).toBe('dupe')
    expect(vm.createSubmitting.value).toBe(false)
    expect(mocks.messageError).toHaveBeenCalledWith('username already exists')
    expect(mocks.pageAdmins).not.toHaveBeenCalled()
  })
})

describe('管理员页 - 启停', () => {
  it('启用态行确认禁用后 PATCH DISABLED 并刷新；取消则不调用', async () => {
    mocks.changeAdminStatus.mockResolvedValue(undefined)
    const vm = useAdminUsers()

    // 取消二次确认
    mocks.confirm.mockRejectedValueOnce(new Error('cancel'))
    await vm.toggleStatus(admin(3, 'ops', 'ENABLED'))
    expect(mocks.changeAdminStatus).not.toHaveBeenCalled()

    // 确认禁用
    mocks.confirm.mockResolvedValueOnce(true)
    await vm.toggleStatus(admin(3, 'ops', 'ENABLED'))
    expect(mocks.confirm).toHaveBeenCalledTimes(2)
    expect(mocks.changeAdminStatus).toHaveBeenCalledWith(3, 'DISABLED')
    expect(mocks.messageSuccess).toHaveBeenCalledWith('已禁用')

    // 禁用态行确认后切换为 ENABLED
    mocks.confirm.mockResolvedValueOnce(true)
    await vm.toggleStatus(admin(3, 'ops', 'DISABLED'))
    expect(mocks.changeAdminStatus).toHaveBeenLastCalledWith(3, 'ENABLED')
  })
})

describe('管理员页 - 重置密码', () => {
  it('二次确认取消则不发请求且对话框保留；确认后 PUT 新密码并关闭', async () => {
    mocks.resetAdminPassword.mockResolvedValue(undefined)
    const vm = useAdminUsers()
    vm.openPassword(admin(5, 'ops'))
    vm.passwordValue.value = 'NewStrongPass1'

    mocks.confirm.mockRejectedValueOnce(new Error('cancel'))
    await vm.submitPassword()
    expect(mocks.resetAdminPassword).not.toHaveBeenCalled()
    expect(vm.passwordVisible.value).toBe(true)

    mocks.confirm.mockResolvedValueOnce(true)
    await vm.submitPassword()
    expect(mocks.resetAdminPassword).toHaveBeenCalledWith(5, 'NewStrongPass1')
    expect(vm.passwordVisible.value).toBe(false)
    expect(mocks.messageSuccess).toHaveBeenCalledWith('密码已重置')
  })

  it('空密码前端拦截，不弹二次确认', async () => {
    const vm = useAdminUsers()
    vm.openPassword(admin(5, 'ops'))
    await vm.submitPassword()
    expect(vm.passwordError.value).toBe('新密码不能为空')
    expect(mocks.confirm).not.toHaveBeenCalled()
    expect(mocks.resetAdminPassword).not.toHaveBeenCalled()
  })
})

describe('管理员页 - 分配角色', () => {
  it('打开时按行 roleIds 回显当前勾选并加载角色选项，保存提交裸 number[]', async () => {
    mocks.listRoles.mockResolvedValue([
      { id: 1, code: 'SUPER_ADMIN', name: '超级管理员', description: null, status: 'ENABLED', builtIn: true, permissionIds: [], menuIds: [] },
      { id: 2, code: 'OPS', name: '运维', description: null, status: 'DISABLED', builtIn: false, permissionIds: [], menuIds: [] },
    ])
    mocks.replaceAdminRoles.mockResolvedValue(undefined)
    const vm = useAdminUsers()

    await vm.openRoleAssign(admin(8, 'ops', 'ENABLED', [1]))

    expect(vm.roleAssignVisible.value).toBe(true)
    expect(vm.roleAssignTarget.value?.id).toBe(8)
    // GET /admins 行已回显当前角色：对话框初始勾选 [1]
    expect(vm.roleAssignIds.value).toEqual([1])
    expect(vm.roleOptions.value.map((role) => role.id)).toEqual([1, 2])

    // 调整勾选后保存：请求体为裸数组，语义是全量覆盖（这里提交全集 [1,2]）
    vm.roleAssignIds.value = [1, 2]
    await vm.submitRoleAssign()

    expect(mocks.replaceAdminRoles).toHaveBeenCalledTimes(1)
    const [targetId, body] = mocks.replaceAdminRoles.mock.calls[0]
    expect(targetId).toBe(8)
    expect(Array.isArray(body)).toBe(true)
    expect(JSON.stringify(body)).toBe('[1,2]')
    expect(vm.roleAssignVisible.value).toBe(false)
  })

  it('行 roleIds 为空数组（无角色）时对话框初始无勾选，且不污染原行数组', async () => {
    mocks.listRoles.mockResolvedValue([])
    const vm = useAdminUsers()
    const row = admin(9, 'newbie')

    await vm.openRoleAssign(row)

    expect(vm.roleAssignIds.value).toEqual([])
    // 回显使用拷贝：后续编辑不应反向改动列表行
    vm.roleAssignIds.value.push(2)
    expect(row.roleIds).toEqual([])
  })

  it('保存失败（如角色停用 400）保留对话框与勾选', async () => {
    mocks.listRoles.mockResolvedValue([])
    mocks.replaceAdminRoles.mockRejectedValueOnce(
      new AxiosError(
        'bad',
        '400',
        undefined,
        undefined,
        { status: 400, statusText: 'Bad', headers: {}, config: {} as never, data: { message: 'role set contains missing or disabled role' } },
      ),
    )
    const vm = useAdminUsers()
    await vm.openRoleAssign(admin(8, 'ops'))
    vm.roleAssignIds.value = [2]

    await vm.submitRoleAssign()

    expect(vm.roleAssignVisible.value).toBe(true)
    expect(vm.roleAssignError.value).toBe('role set contains missing or disabled role')
  })
})
