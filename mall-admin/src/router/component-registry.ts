import type { Component } from 'vue'

const components: Record<string, () => Promise<Component>> = {
  Workbench: () => import('@/views/WorkbenchView.vue'),
  CategoryTree: () => import('@/views/product/CategoryTreeView.vue'),
  BrandList: () => import('@/views/product/BrandListView.vue'),
  ProductList: () => import('@/views/product/ProductListView.vue'),
  InventoryList: () => import('@/views/inventory/InventoryListView.vue'),
  InventoryLog: () => import('@/views/inventory/InventoryLogView.vue'),
  OrderList: () => import('@/views/order/OrderListView.vue'),
  CompensationList: () => import('@/views/order/CompensationListView.vue'),
  // M5：搜索索引管理（CHG-0021 FE-502）
  SearchIndex: () => import('@/views/search/SearchIndexView.vue'),
  // M5：系统配置三页（CHG-0022 FE-503，component_key 由后端菜单配置）
  FeatureConfigs: () => import('@/views/config/FeatureConfigsView.vue'),
  SystemParameters: () => import('@/views/config/SystemParametersView.vue'),
  ConfigHistory: () => import('@/views/config/ConfigHistoryView.vue'),
  // M5：RBAC 管理台（CHG-0023 Story1，component_key 对齐后端 V11 菜单种子：
  // /security/admins、/security/roles、/security/menus）
  SecurityAdmins: () => import('@/views/security/AdminUserListView.vue'),
  SecurityRoles: () => import('@/views/security/RoleListView.vue'),
  SecurityMenus: () => import('@/views/security/MenuTreeView.vue'),
  // M6：AI 知识库管理（CHG-0024 DU-FE-003，component_key 对齐 V12 菜单种子 /ai/knowledge）
  AiKnowledge: () => import('@/views/knowledge/KnowledgeListView.vue'),
  // M7：Outbox 事件管理（CHG-0025 STORY-009-02-01，component_key 对齐 V13 菜单种子 /distributed/outbox）
  OutboxList: () => import('@/views/distributed/OutboxListView.vue'),
}

export function resolveComponent(key: string) {
  const component = components[key]
  if (!component) throw new Error(`Unsupported menu component: ${key}`)
  return component
}
