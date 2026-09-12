import type { Directive, DirectiveBinding } from 'vue'
import { pinia } from '@/stores'
import { usePermissionStore } from '@/stores/permission'

type PermissionBinding = string | string[] | { code: string | string[], mode?: 'hide' | 'disabled' }
export function applyPermission(element: HTMLElement, binding: DirectiveBinding<PermissionBinding>) {
  const value = typeof binding.value === 'object' && !Array.isArray(binding.value) ? binding.value.code : binding.value
  const mode = typeof binding.value === 'object' && binding.value && !Array.isArray(binding.value) ? binding.value.mode ?? 'hide' : 'hide'
  const required = Array.isArray(value) ? value : [value]
  const allowed = required.every((code) => usePermissionStore(pinia).has(code))
  if (mode === 'disabled') {
    if ('disabled' in element) (element as HTMLButtonElement).disabled = !allowed
    element.setAttribute('aria-disabled', String(!allowed)); element.hidden = false
  } else element.hidden = !allowed
}
export const permissionDirective: Directive<HTMLElement, PermissionBinding> = {
  mounted: applyPermission,
  updated: applyPermission,
}
