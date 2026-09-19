import { computed, reactive, ref } from 'vue'
import type { ElTree } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import { securityApi, extractSecurityMessage } from '@/api/security'
import type { RbacStatus, RoleRow } from '@/api/security'
import { useSecurityStore } from '@/stores/security'
import {
  buildAuthorizationPayload,
  buildMenuTree,
  groupPermissionsByType,
} from './security-display'

/**
 * 角色管理页行为（CHG-0023 Story1）：
 * 角色新建/编辑/删除 + 权限分配抽屉（菜单树勾选 + 权限点勾选，PUT /role-authorizations 全量覆盖）。
 */
export function useRoles() {
  const store = useSecurityStore()

  async function loadRoles(): Promise<void> {
    await store.loadRoles(true)
    if (store.rolesLoadError) ElMessage.error(store.rolesLoadError)
  }

  // ── 新建 / 编辑对话框 ────────────────────────────────────────
  const dialogVisible = ref(false)
  const dialogSubmitting = ref(false)
  const editingRole = ref<RoleRow | null>(null)
  const dialogError = ref('')
  const form = reactive({ code: '', name: '', description: '', status: 'ENABLED' as RbacStatus })

  function isEditing(): boolean {
    return editingRole.value !== null
  }

  function openCreate(): void {
    editingRole.value = null
    form.code = ''
    form.name = ''
    form.description = ''
    form.status = 'ENABLED'
    dialogError.value = ''
    dialogVisible.value = true
  }

  function openEdit(row: RoleRow): void {
    editingRole.value = row
    form.code = row.code
    form.name = row.name
    form.description = row.description ?? ''
    form.status = row.status
    dialogError.value = ''
    dialogVisible.value = true
  }

  async function submitForm(): Promise<void> {
    const code = form.code.trim()
    const name = form.name.trim()
    const description = form.description.trim()
    if (!name) {
      dialogError.value = '角色名称不能为空'
      return
    }
    if (!isEditing() && !code) {
      dialogError.value = '角色编码不能为空'
      return
    }
    dialogSubmitting.value = true
    dialogError.value = ''
    try {
      if (isEditing() && editingRole.value) {
        await securityApi.updateRole(editingRole.value.id, {
          name,
          description: description || undefined,
          status: form.status,
        })
        ElMessage.success('角色已更新')
      } else {
        await securityApi.createRole({
          code,
          name,
          description: description || undefined,
        })
        ElMessage.success('角色创建成功')
      }
      dialogVisible.value = false
      await loadRoles()
    } catch (ex) {
      // 409（编码冲突/内置角色不可改）：保留对话框与表单内容
      dialogError.value = extractSecurityMessage(ex, '角色保存失败')
      ElMessage.error(dialogError.value)
    } finally {
      dialogSubmitting.value = false
    }
  }

  // ── 删除（二次确认）─────────────────────────────────────────
  const deletingId = ref<number | null>(null)

  async function remove(row: RoleRow): Promise<void> {
    try {
      await ElMessageBox.confirm(
        `确认删除角色「${row.name}」？删除后该角色下管理员将立即失去对应权限。`,
        '删除角色确认',
        { type: 'warning', confirmButtonText: '确定', cancelButtonText: '取消' },
      )
    } catch {
      return // 用户取消
    }
    deletingId.value = row.id
    try {
      await securityApi.deleteRole(row.id)
      ElMessage.success('角色已删除')
      await loadRoles()
    } catch (ex) {
      // 内置角色/仍被引用时后端 409，展示后端 message
      ElMessage.error(extractSecurityMessage(ex, '角色删除失败'))
    } finally {
      deletingId.value = null
    }
  }

  // ── 权限分配抽屉 ─────────────────────────────────────────────
  // 回显数据来源：GET /roles 每行 menuIds / permissionIds 即角色当前授权（空数组表示无授权），
  // 打开抽屉时用其初始化勾选；菜单树通过 :default-checked-keys 绑定 checkedMenuIds，
  // el-tree 在 data 异步到达（store.loadMenus 完成）后会经 treeStore.setData →
  // _initDefaultCheckedNodes 按 defaultCheckedKeys 重新勾选，缓存/异步两种时序均可正确回显。
  // 提交仍调 PUT /role-authorizations，语义为全量覆盖。
  const drawerVisible = ref(false)
  const drawerSubmitting = ref(false)
  const drawerError = ref('')
  const authRole = ref<RoleRow | null>(null)
  const checkedMenuIds = ref<number[]>([])
  const checkedPermissionIds = ref<number[]>([])
  const menuTreeRef = ref<InstanceType<typeof ElTree> | null>(null)

  const menuTree = computed(() => buildMenuTree(store.menus))
  const permissionGroups = computed(() => groupPermissionsByType(store.permissions))

  /** 从 el-tree 收集勾选全集（含完全勾选的父级菜单，不含半勾选）；无树实例时回退状态数组 */
  function collectCheckedMenuIds(): number[] {
    const keys = menuTreeRef.value?.getCheckedKeys(false) as number[] | undefined
    if (keys) return keys.map((key) => Number(key))
    return [...checkedMenuIds.value]
  }

  /** el-tree check 事件回调：把勾选状态同步回响应式数组（与权限点勾选保持同一状态风格） */
  function syncCheckedMenus(): void {
    checkedMenuIds.value = collectCheckedMenuIds()
  }

  async function openAuthorization(row: RoleRow): Promise<void> {
    authRole.value = row
    // 按 GET /roles 出参回显当前授权；拷贝避免勾选编辑反向污染列表行对象
    checkedMenuIds.value = [...row.menuIds]
    checkedPermissionIds.value = [...row.permissionIds]
    drawerError.value = ''
    drawerVisible.value = true
    await Promise.allSettled([store.loadMenus(), store.loadPermissions()])
    const errors = [store.menusLoadError, store.permissionsLoadError].filter(Boolean)
    if (errors.length) {
      drawerError.value = errors.join('；')
      ElMessage.error(drawerError.value)
    }
  }

  async function submitAuthorization(): Promise<void> {
    const target = authRole.value
    if (!target) return
    drawerSubmitting.value = true
    drawerError.value = ''
    try {
      const menuIds = collectCheckedMenuIds()
      checkedMenuIds.value = menuIds
      // 菜单 + 权限点均提交勾选全集（全量覆盖语义）
      const payload = buildAuthorizationPayload(target.id, [...checkedPermissionIds.value], menuIds)
      await securityApi.replaceRoleAuthorizations(payload)
      ElMessage.success('权限分配已保存（全量覆盖）')
      drawerVisible.value = false
      await store.loadRoles(true)
    } catch (ex) {
      // 勾选了停用菜单/权限点等 400：保留抽屉与勾选状态
      drawerError.value = extractSecurityMessage(ex, '权限分配保存失败')
      ElMessage.error(drawerError.value)
    } finally {
      drawerSubmitting.value = false
    }
  }

  return {
    store,
    loadRoles,
    // 新建/编辑
    dialogVisible,
    dialogSubmitting,
    editingRole,
    dialogError,
    form,
    isEditing,
    openCreate,
    openEdit,
    submitForm,
    // 删除
    deletingId,
    remove,
    // 权限分配抽屉
    drawerVisible,
    drawerSubmitting,
    drawerError,
    authRole,
    checkedMenuIds,
    checkedPermissionIds,
    menuTreeRef,
    menuTree,
    permissionGroups,
    syncCheckedMenus,
    openAuthorization,
    submitAuthorization,
  }
}
