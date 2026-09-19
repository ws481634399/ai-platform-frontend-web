import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { securityApi, extractSecurityMessage } from '@/api/security'
import type {
  AdminRow,
  AdminUserStatus,
  MenuNode,
  PermissionNode,
  RoleRow,
} from '@/api/security'

/**
 * RBAC 管理台 Store（M5 CHG-0023 Story1 / DU-FE-701）。
 *
 * 职责边界：
 * - 管理员分页：后端只有 page/size，不支持服务端搜索；用户名/状态筛选为「当前页本地过滤」computed，
 *   过滤条件变化不触发任何请求。
 * - 角色/菜单/权限点列表：页面按需加载一次（抽屉/对话框复用，避免重复请求）。
 * - 写操作（新建/启停/重置密码/分配角色/角色 CRUD/授权替换）由各视图 composable 直接调 api，
 *   成功后回调本 store 的加载动作刷新。
 */
export const useSecurityStore = defineStore('security', () => {
  // ── 管理员分页 ───────────────────────────────────────────────
  const admins = ref<AdminRow[]>([])
  const adminTotal = ref(0)
  const adminPage = ref(1)
  const adminSize = ref(20)
  const adminsLoading = ref(false)
  /** 最近一次加载失败的文案（null 表示无错误），视图据此 ElMessage 提示 */
  const adminsLoadError = ref<string | null>(null)

  /** 用户名关键字（仅匹配当前页） */
  const adminKeyword = ref('')
  /** 状态筛选（'' 表示不限，仅作用于当前页） */
  const adminStatusFilter = ref<AdminUserStatus | ''>('')

  /** 当前页本地过滤结果：用户名包含关键字 + 状态精确匹配；不发起请求 */
  const filteredAdmins = computed<AdminRow[]>(() => {
    const keyword = adminKeyword.value.trim().toLowerCase()
    const status = adminStatusFilter.value
    return admins.value.filter((row) => {
      const matchKeyword = !keyword || row.username.toLowerCase().includes(keyword)
      const matchStatus = !status || row.status === status
      return matchKeyword && matchStatus
    })
  })

  async function loadAdmins(): Promise<void> {
    adminsLoading.value = true
    adminsLoadError.value = null
    try {
      const view = await securityApi.pageAdmins(adminPage.value, adminSize.value)
      admins.value = view.items
      adminTotal.value = view.total
    } catch (ex) {
      // 保留旧数据不清空，错误文案供视图提示（含后端 UnifyResult.message）
      adminsLoadError.value = extractSecurityMessage(ex, '管理员列表加载失败')
    } finally {
      adminsLoading.value = false
    }
  }

  function resetAdminFilters(): void {
    adminKeyword.value = ''
    adminStatusFilter.value = ''
  }

  // ── 角色全量列表（分配角色对话框 / 角色管理共用） ─────────────
  const roles = ref<RoleRow[]>([])
  const rolesLoading = ref(false)
  const rolesLoadError = ref<string | null>(null)
  let rolesLoaded = false

  async function loadRoles(force = false): Promise<void> {
    if (rolesLoaded && !force) return
    rolesLoading.value = true
    rolesLoadError.value = null
    try {
      roles.value = await securityApi.listRoles()
      rolesLoaded = true
    } catch (ex) {
      rolesLoadError.value = extractSecurityMessage(ex, '角色列表加载失败')
    } finally {
      rolesLoading.value = false
    }
  }

  // ── 菜单全量列表（权限分配抽屉 / 菜单只读页共用） ─────────────
  const menus = ref<MenuNode[]>([])
  const menusLoading = ref(false)
  const menusLoadError = ref<string | null>(null)
  let menusLoaded = false

  async function loadMenus(force = false): Promise<void> {
    if (menusLoaded && !force) return
    menusLoading.value = true
    menusLoadError.value = null
    try {
      menus.value = await securityApi.listMenus()
      menusLoaded = true
    } catch (ex) {
      menusLoadError.value = extractSecurityMessage(ex, '菜单列表加载失败')
    } finally {
      menusLoading.value = false
    }
  }

  // ── 权限点全量列表（权限分配抽屉共用） ───────────────────────
  const permissions = ref<PermissionNode[]>([])
  const permissionsLoading = ref(false)
  const permissionsLoadError = ref<string | null>(null)
  let permissionsLoaded = false

  async function loadPermissions(force = false): Promise<void> {
    if (permissionsLoaded && !force) return
    permissionsLoading.value = true
    permissionsLoadError.value = null
    try {
      permissions.value = await securityApi.listPermissions()
      permissionsLoaded = true
    } catch (ex) {
      permissionsLoadError.value = extractSecurityMessage(ex, '权限点列表加载失败')
    } finally {
      permissionsLoading.value = false
    }
  }

  return {
    // 管理员分页
    admins,
    adminTotal,
    adminPage,
    adminSize,
    adminsLoading,
    adminsLoadError,
    adminKeyword,
    adminStatusFilter,
    filteredAdmins,
    loadAdmins,
    resetAdminFilters,
    // 角色/菜单/权限点
    roles,
    rolesLoading,
    rolesLoadError,
    loadRoles,
    menus,
    menusLoading,
    menusLoadError,
    loadMenus,
    permissions,
    permissionsLoading,
    permissionsLoadError,
    loadPermissions,
  }
})
