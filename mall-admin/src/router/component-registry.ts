import type { Component } from 'vue'

const components: Record<string, () => Promise<Component>> = {
  Workbench: () => import('@/views/WorkbenchView.vue'),
  Users: () => import('@/views/UsersPlaceholderView.vue'),
  Products: () => import('@/views/ProductsPlaceholderView.vue'),
  Settings: () => import('@/views/SettingsPlaceholderView.vue'),
}

export function resolveComponent(key: string) {
  const component = components[key]
  if (!component) throw new Error(`Unsupported menu component: ${key}`)
  return component
}
