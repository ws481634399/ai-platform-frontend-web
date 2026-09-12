import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { AdminMenu, BootstrapResponse } from '@/types/auth'

export const usePermissionStore = defineStore('permission', () => {
  const menus = ref<AdminMenu[]>([])
  const permissionVersion = ref(0)
  const codes = ref<Set<string>>(new Set())
  const permissions = computed(() => [...codes.value].sort())

  function normalize(items: AdminMenu[]): AdminMenu[] {
    return items.map((menu) => ({ ...menu, name: String(menu.name), children: normalize(menu.children ?? []) }))
      .filter((menu) => menu.visible && (menu.type !== 'DIRECTORY' || (menu.children?.length ?? 0) > 0))
      .sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id))
  }

  function applyBootstrap(snapshot: BootstrapResponse) {
    menus.value = normalize(snapshot.menus)
    codes.value = new Set(snapshot.permissions)
    permissionVersion.value = snapshot.permissionVersion
  }
  function has(code?: string) { return !code || codes.value.has(code) }
  function clear() { menus.value = []; codes.value = new Set(); permissionVersion.value = 0 }
  return { menus, permissions, permissionVersion, applyBootstrap, has, clear }
})
