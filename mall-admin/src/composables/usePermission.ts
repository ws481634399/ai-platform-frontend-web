import { usePermissionStore } from '@/stores/permission'

export function usePermission() {
  const store = usePermissionStore()
  return {
    has: (code: string) => store.has(code),
    hasAny: (codes: string[]) => codes.some(store.has),
    hasAll: (codes: string[]) => codes.every(store.has),
  }
}
