<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'
import { usePermissionStore } from '@/stores/permission'
import { clearSession } from '@/auth/clear-session'
import DynamicMenuItem from '@/components/DynamicMenuItem.vue'
import PageHeader from '@/components/PageHeader.vue'
import { Fold, Expand, ArrowDown } from '@element-plus/icons-vue'

const appStore = useAppStore()
const route = useRoute()
const router = useRouter()
const isCollapse = computed(() => appStore.isCollapsed)
const authStore = useAuthStore()
const permissionStore = usePermissionStore()
const menuItems = computed(() => permissionStore.menus)
async function logout() {
  try { await authStore.logout() } finally { await clearSession(router) }
}
</script>

<template>
  <el-container class="admin-layout">
    <el-aside
      :width="isCollapse ? 'var(--admin-sidebar-collapsed-width)' : 'var(--admin-sidebar-width)'"
      class="admin-layout__sidebar"
    >
      <div class="admin-layout__brand">
        <span class="admin-layout__brand-mark">AI</span>
        <span
          v-if="!isCollapse"
          class="admin-layout__brand-name"
        >{{ appStore.appName }}</span>
      </div>
      <el-menu
        :default-active="route.path"
        :collapse="isCollapse"
        router
        class="admin-layout__menu"
      >
        <DynamicMenuItem
          v-for="item in menuItems"
          :key="item.id"
          :item="item"
        />
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="admin-layout__header">
        <el-button
          text
          :icon="isCollapse ? Expand : Fold"
          class="admin-layout__collapse"
          data-testid="collapse-btn"
          @click="appStore.toggleSidebar()"
        >
          <span class="admin-layout__collapse-text">{{ isCollapse ? '展开' : '折叠' }}</span>
        </el-button>

        <div class="admin-layout__breadcrumb">
          <PageHeader inline />
        </div>

        <el-dropdown class="admin-layout__user">
          <span class="admin-layout__user-trigger">
            <span class="admin-layout__user-avatar">{{ authStore.user?.username?.charAt(0)?.toUpperCase() ?? 'A' }}</span>
            <span class="admin-layout__user-name">{{ authStore.user?.username ?? '管理员' }}</span>
            <el-icon class="admin-layout__user-arrow"><ArrowDown /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item disabled>个人中心</el-dropdown-item>
              <el-dropdown-item divided @click="logout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </el-header>
      <el-main class="admin-layout__main">
        <PageHeader />
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<style scoped>
.admin-layout {
  min-height: 100vh;
}

/* ── Sidebar ────────────────────────── */
.admin-layout__sidebar {
  background: var(--admin-bg);
  border-right: 1px solid var(--admin-border-light);
  transition: width var(--admin-transition);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.admin-layout__brand {
  display: flex;
  align-items: center;
  gap: var(--admin-space-2);
  height: var(--admin-header-height);
  padding: 0 var(--admin-space-4);
  border-bottom: 1px solid var(--admin-border-light);
  font-weight: 700;
  color: var(--admin-text);
  white-space: nowrap;
  overflow: hidden;
  flex-shrink: 0;
}

.admin-layout__brand-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: var(--admin-radius-md);
  background: var(--admin-text);
  color: var(--admin-bg);
  font-size: 13px;
  font-weight: 700;
  flex-shrink: 0;
}

.admin-layout__brand-name {
  font-size: 15px;
  letter-spacing: -0.01em;
  overflow: hidden;
  text-overflow: ellipsis;
}

.admin-layout__menu {
  flex: 1;
  border-right: none !important;
  overflow-y: auto;
  overflow-x: hidden;
}

/* ── Header ─────────────────────────── */
.admin-layout__header {
  display: flex;
  align-items: center;
  gap: var(--admin-space-3);
  height: var(--admin-header-height) !important;
  padding: 0 var(--admin-space-4) !important;
  border-bottom: 1px solid var(--admin-border-light);
  background: var(--admin-bg);
  flex-shrink: 0;
}

.admin-layout__collapse {
  font-size: 14px;
  color: var(--admin-text-secondary) !important;
  padding: var(--admin-space-2) !important;
}
.admin-layout__collapse-text {
  margin-left: var(--admin-space-1);
}
.admin-layout__breadcrumb {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.admin-layout__user {
  cursor: pointer;
  flex-shrink: 0;
}

.admin-layout__user-trigger {
  display: flex;
  align-items: center;
  gap: var(--admin-space-2);
  padding: var(--admin-space-1) var(--admin-space-2) var(--admin-space-1) var(--admin-space-1);
  border-radius: var(--admin-radius-md);
  transition: background var(--admin-transition);
  outline: none;
}
.admin-layout__user-trigger:hover,
.admin-layout__user-trigger:focus-visible {
  background: var(--admin-bg-panel);
}

.admin-layout__user-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--admin-primary);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
}

.admin-layout__user-name {
  color: var(--admin-text);
  font-size: 14px;
  font-weight: 500;
}

.admin-layout__user-arrow {
  color: var(--admin-text-tertiary);
  font-size: 12px;
}

/* ── Main ───────────────────────────── */
.admin-layout__main {
  padding: var(--admin-space-5) var(--admin-content-padding) !important;
  background: var(--admin-bg-subtle);
  flex: 1;
  min-width: 0;
  overflow-y: auto;
}

/* ── 响应式 ─────────────────────────── */
@media (max-width: 768px) {
  .admin-layout__collapse-text {
    display: none;
  }
  .admin-layout__user-name {
    display: none;
  }
  .admin-layout__main {
    padding: var(--admin-space-3) var(--admin-space-3) !important;
  }
}
</style>
