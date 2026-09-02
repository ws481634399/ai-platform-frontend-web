import { defineStore } from 'pinia'
import { ref } from 'vue'

/** 应用级最小 Store（M0 验证载体：侧栏折叠状态在 Header 与 Sidebar 间同步） */
export const useAppStore = defineStore('app', () => {
  /** 应用名称，来自环境变量 VITE_APP_TITLE */
  const appName = ref<string>(import.meta.env.VITE_APP_TITLE || 'AI Mall 后台')
  /** 侧栏折叠状态（跨组件同步验证，非持久化） */
  const isCollapsed = ref(false)

  function toggleSidebar() {
    isCollapsed.value = !isCollapsed.value
  }

  return { appName, isCollapsed, toggleSidebar }
})
