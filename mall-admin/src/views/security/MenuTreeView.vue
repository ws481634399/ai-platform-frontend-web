<template>
  <div class="menu-tree-page">
    <!-- 菜单层级（只读） -->
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>菜单层级</span>
          <span class="card-header__hint">只读视图，数据来自 GET /api/admin/security/menus</span>
        </div>
      </template>
      <el-tree
        v-loading="store.menusLoading"
        :data="menuTree"
        node-key="id"
        default-expand-all
        :props="{ label: 'name', children: 'children' }"
        data-testid="menu-tree"
      >
        <template #default="{ data }">
          <span class="menu-node">
            <span class="menu-node__name">{{ (data as MenuTreeNode).name }}</span>
            <el-tag
              :type="menuTypeTagType((data as MenuTreeNode).type)"
              size="small"
            >
              {{ menuTypeLabel((data as MenuTreeNode).type) }}
            </el-tag>
            <el-tag
              :type="rbacStatusTagType((data as MenuTreeNode).status)"
              size="small"
              effect="plain"
            >
              {{ rbacStatusLabel((data as MenuTreeNode).status) }}
            </el-tag>
            <span
              v-if="(data as MenuTreeNode).path"
              class="menu-node__meta"
            >路径：{{ (data as MenuTreeNode).path }}</span>
            <span
              v-if="(data as MenuTreeNode).componentKey"
              class="menu-node__meta"
            >组件：{{ (data as MenuTreeNode).componentKey }}</span>
            <span
              v-if="(data as MenuTreeNode).permissionCode"
              class="menu-node__code"
            >权限码：{{ (data as MenuTreeNode).permissionCode }}</span>
          </span>
        </template>
      </el-tree>
    </el-card>

    <!-- 权限点清单（只读表格） -->
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>权限点清单</span>
          <span class="card-header__hint">只读视图，数据来自 GET /api/admin/security/permissions</span>
        </div>
      </template>
      <el-table
        v-loading="store.permissionsLoading"
        :data="store.permissions"
        border
        stripe
        size="small"
        data-testid="permission-table"
      >
        <el-table-column
          prop="id"
          label="ID"
          width="90"
          align="center"
          class-name="tabular"
        />
        <el-table-column
          prop="code"
          label="权限码"
          min-width="200"
          show-overflow-tooltip
        />
        <el-table-column
          prop="name"
          label="名称"
          min-width="140"
          show-overflow-tooltip
        />
        <el-table-column
          label="类型"
          width="90"
          align="center"
        >
          <template #default="{ row }">
            <el-tag
              :type="permissionTypeTagType((row as PermissionNode).type)"
              size="small"
              effect="plain"
            >
              {{ permissionTypeLabel((row as PermissionNode).type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          label="方法"
          width="90"
          align="center"
        >
          <template #default="{ row }">
            {{ (row as PermissionNode).httpMethod || '—' }}
          </template>
        </el-table-column>
        <el-table-column
          prop="apiPattern"
          label="API 匹配"
          min-width="220"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            {{ (row as PermissionNode).apiPattern || '—' }}
          </template>
        </el-table-column>
        <el-table-column
          label="状态"
          width="90"
          align="center"
        >
          <template #default="{ row }">
            <el-tag
              :type="rbacStatusTagType((row as PermissionNode).status)"
              size="small"
              effect="plain"
            >
              {{ rbacStatusLabel((row as PermissionNode).status) }}
            </el-tag>
          </template>
        </el-table-column>
        <template #empty>
          暂无权限点数据
        </template>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import type { PermissionNode } from '@/api/security'
import {
  menuTypeLabel,
  menuTypeTagType,
  permissionTypeLabel,
  permissionTypeTagType,
  rbacStatusLabel,
  rbacStatusTagType,
  type MenuTreeNode,
} from './security-display'
import { useMenuTreePage } from './use-menu-tree'

const { store, menuTree, loadAll } = useMenuTreePage()

onMounted(() => {
  void loadAll()
})
</script>

<style scoped>
.menu-tree-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
}

.card-header__hint {
  font-weight: 400;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.menu-node {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.menu-node__name {
  font-weight: 500;
}

.menu-node__meta {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.menu-node__code {
  color: var(--el-color-primary);
  font-size: 12px;
}
</style>
