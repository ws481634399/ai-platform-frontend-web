import { computed, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { securityApi, extractSecurityMessage } from '@/api/security'
import type { AdminRow, AdminUserStatus } from '@/api/security'
import { useSecurityStore } from '@/stores/security'

/**
 * 管理员管理页行为（CHG-0023 Story1）：
 * 分页加载/本地过滤在 security store；本 composable 承载新建、启停、重置密码、分配角色四个写操作。
 */
export function useAdminUsers() {
  const store = useSecurityStore()

  // ── 新建管理员对话框 ─────────────────────────────────────────
  const createVisible = ref(false)
  const createSubmitting = ref(false)
  const createForm = reactive({ username: '', password: '' })
  /** 最近一次提交失败文案（如 409 用户名已存在），对话框保留期间内联提示 */
  const createError = ref('')

  function openCreate(): void {
    createForm.username = ''
    createForm.password = ''
    createError.value = ''
    createVisible.value = true
  }

  async function submitCreate(): Promise<void> {
    const username = createForm.username.trim()
    // 密码不做 trim（允许首尾字符策略由后端 PasswordPolicy 终验）
    const password = createForm.password
    if (!username || !password) {
      createError.value = '用户名和初始密码不能为空'
      return
    }
    createSubmitting.value = true
    createError.value = ''
    try {
      await securityApi.createAdmin({ username, password })
      ElMessage.success('管理员创建成功，可继续为其分配角色')
      createVisible.value = false
      await store.loadAdmins()
    } catch (ex) {
      // 409（用户名冲突）等：保留对话框与已填内容，展示后端 message 便于重试
      createError.value = extractSecurityMessage(ex, '管理员创建失败')
      ElMessage.error(createError.value)
    } finally {
      createSubmitting.value = false
    }
  }

  // ── 启用 / 禁用（二次确认）──────────────────────────────────
  const togglingId = ref<number | null>(null)

  async function toggleStatus(row: AdminRow): Promise<void> {
    const enabling = row.status !== 'ENABLED'
    try {
      await ElMessageBox.confirm(
        enabling ? `确认启用管理员「${row.username}」？` : `确认禁用管理员「${row.username}」？`,
        '状态变更确认',
        { type: 'warning', confirmButtonText: '确定', cancelButtonText: '取消' },
      )
    } catch {
      return // 用户取消
    }
    const next: AdminUserStatus = enabling ? 'ENABLED' : 'DISABLED'
    togglingId.value = row.id
    try {
      await securityApi.changeAdminStatus(row.id, next)
      ElMessage.success(enabling ? '已启用' : '已禁用')
      await store.loadAdmins()
    } catch (ex) {
      ElMessage.error(extractSecurityMessage(ex, '状态变更失败'))
    } finally {
      togglingId.value = null
    }
  }

  // ── 重置密码（对话框输入 + 二次确认）─────────────────────────
  const passwordVisible = ref(false)
  const passwordSubmitting = ref(false)
  const passwordTarget = ref<AdminRow | null>(null)
  const passwordValue = ref('')
  const passwordError = ref('')

  function openPassword(row: AdminRow): void {
    passwordTarget.value = row
    passwordValue.value = ''
    passwordError.value = ''
    passwordVisible.value = true
  }

  async function submitPassword(): Promise<void> {
    const target = passwordTarget.value
    if (!target) return
    if (!passwordValue.value) {
      passwordError.value = '新密码不能为空'
      return
    }
    try {
      await ElMessageBox.confirm(
        `确认重置管理员「${target.username}」的密码？重置后原密码立即失效。`,
        '重置密码确认',
        { type: 'warning', confirmButtonText: '确定', cancelButtonText: '取消' },
      )
    } catch {
      return // 用户在二次确认中取消，对话框保留
    }
    passwordSubmitting.value = true
    passwordError.value = ''
    try {
      await securityApi.resetAdminPassword(target.id, passwordValue.value)
      ElMessage.success('密码已重置')
      passwordVisible.value = false
    } catch (ex) {
      // 密码强度不足等 400：保留对话框与输入
      passwordError.value = extractSecurityMessage(ex, '密码重置失败')
      ElMessage.error(passwordError.value)
    } finally {
      passwordSubmitting.value = false
    }
  }

  // ── 分配角色 ─────────────────────────────────────────────────
  // 回显数据来源：GET /admins 分页行 roleIds 即该管理员当前角色 ID（无角色为空数组），
  // 打开对话框时用其初始化多选勾选；保存调 PUT /admins/{id}/roles 发裸 number[]，语义仍为全量覆盖。
  const roleAssignVisible = ref(false)
  const roleAssignSubmitting = ref(false)
  const roleAssignTarget = ref<AdminRow | null>(null)
  const roleAssignIds = ref<number[]>([])
  const roleAssignError = ref('')

  /** 角色多选选项（来自 GET /roles 全量；停用角色在 UI 上禁选，后端 allEnabled 也会拒绝） */
  const roleOptions = computed(() => store.roles)

  async function openRoleAssign(row: AdminRow): Promise<void> {
    roleAssignTarget.value = row
    // 按分页行 roleIds 回显当前勾选；拷贝避免多选编辑反向污染列表行对象
    roleAssignIds.value = [...row.roleIds]
    roleAssignError.value = ''
    roleAssignVisible.value = true
    await store.loadRoles()
    if (store.rolesLoadError) {
      roleAssignError.value = store.rolesLoadError
      ElMessage.error(store.rolesLoadError)
    }
  }

  async function submitRoleAssign(): Promise<void> {
    const target = roleAssignTarget.value
    if (!target) return
    roleAssignSubmitting.value = true
    roleAssignError.value = ''
    try {
      // 请求体为裸 JSON 数组 number[]，不是 { roleIds }
      await securityApi.replaceAdminRoles(target.id, [...roleAssignIds.value])
      ElMessage.success('角色分配已保存（全量覆盖）')
      roleAssignVisible.value = false
    } catch (ex) {
      roleAssignError.value = extractSecurityMessage(ex, '角色分配失败')
      ElMessage.error(roleAssignError.value)
    } finally {
      roleAssignSubmitting.value = false
    }
  }

  return {
    store,
    // 新建
    createVisible,
    createSubmitting,
    createForm,
    createError,
    openCreate,
    submitCreate,
    // 启停
    togglingId,
    toggleStatus,
    // 重置密码
    passwordVisible,
    passwordSubmitting,
    passwordTarget,
    passwordValue,
    passwordError,
    openPassword,
    submitPassword,
    // 分配角色
    roleAssignVisible,
    roleAssignSubmitting,
    roleAssignTarget,
    roleAssignIds,
    roleAssignError,
    roleOptions,
    openRoleAssign,
    submitRoleAssign,
  }
}
