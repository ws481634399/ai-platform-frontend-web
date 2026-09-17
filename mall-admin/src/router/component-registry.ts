import type { Component } from 'vue'

const components: Record<string, () => Promise<Component>> = {
  Workbench: () => import('@/views/WorkbenchView.vue'),
  Users: () => import('@/views/UsersPlaceholderView.vue'),
  Products: () => import('@/views/ProductsPlaceholderView.vue'),
  Settings: () => import('@/views/SettingsPlaceholderView.vue'),
  CategoryTree: () => import('@/views/product/CategoryTreeView.vue'),
  BrandList: () => import('@/views/product/BrandListView.vue'),
  ProductList: () => import('@/views/product/ProductListView.vue'),
  InventoryList: () => import('@/views/inventory/InventoryListView.vue'),
  InventoryLog: () => import('@/views/inventory/InventoryLogView.vue'),
  OrderList: () => import('@/views/order/OrderListView.vue'),
  CompensationList: () => import('@/views/order/CompensationListView.vue'),
}

export function resolveComponent(key: string) {
  const component = components[key]
  if (!component) throw new Error(`Unsupported menu component: ${key}`)
  return component
}
