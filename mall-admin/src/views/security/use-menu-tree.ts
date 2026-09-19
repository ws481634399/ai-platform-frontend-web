import { computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useSecurityStore } from '@/stores/security'
import { buildMenuTree, groupPermissionsByType } from './security-display'

/**
 * 菜单权限只读页行为（CHG-0023 Story1）：
 * 仅加载 GET /menus 与 GET /permissions 并组树/分组，不提供任何写操作。
 */
export function useMenuTreePage() {
  const store = useSecurityStore()

  const menuTree = computed(() => buildMenuTree(store.menus))
  const permissionGroups = computed(() => groupPermissionsByType(store.permissions))

  async function loadAll(): Promise<void> {
    await Promise.allSettled([store.loadMenus(), store.loadPermissions()])
    const errors = [store.menusLoadError, store.permissionsLoadError].filter(
      (value): value is string => Boolean(value),
    )
    errors.forEach((message) => ElMessage.error(message))
  }

  return {
    store,
    menuTree,
    permissionGroups,
    loadAll,
  }
}
