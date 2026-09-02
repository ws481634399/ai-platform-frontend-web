<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import { useAppStore } from '@/stores/app'
import { menuItems } from './MenuItems'

const appStore = useAppStore()
const route = useRoute()
const isCollapse = computed(() => appStore.isCollapsed)
</script>

<template>
  <el-container class="admin-layout">
    <el-aside :width="isCollapse ? '64px' : '200px'" class="admin-layout__sidebar">
      <div class="admin-layout__brand">
        {{ isCollapse ? 'M' : appStore.appName }}
      </div>
      <el-menu :default-active="route.path" :collapse="isCollapse" router>
        <el-menu-item v-for="item in menuItems" :key="item.path" :index="item.path">
          <el-icon><component :is="item.icon" /></el-icon>
          <template #title>{{ item.title }}</template>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="admin-layout__header">
        <el-button text data-testid="collapse-btn" @click="appStore.toggleSidebar()">
          {{ isCollapse ? '展开侧栏' : '折叠侧栏' }}
        </el-button>
        <el-dropdown>
          <span class="admin-layout__user">admin（占位）</span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item>个人中心（占位）</el-dropdown-item>
              <el-dropdown-item>退出（占位）</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </el-header>
      <el-main class="admin-layout__main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<style scoped>
.admin-layout {
  min-height: 100vh;
}

.admin-layout__sidebar {
  border-right: 1px solid #e5e7eb;
  transition: width 0.2s;
}

.admin-layout__brand {
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
}

.admin-layout__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #e5e7eb;
}

.admin-layout__user {
  cursor: pointer;
  color: #409eff;
}
</style>
