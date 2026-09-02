import { defineStore } from 'pinia'
import { ref } from 'vue'

/** 应用级最小 Store（M0 Pinia 验证载体；业务 Store 从 M1 起按域新增） */
export const useAppStore = defineStore('app', () => {
  /** 应用名称，来自环境变量 VITE_APP_TITLE */
  const appName = ref<string>(import.meta.env.VITE_APP_TITLE || 'AI Mall')
  /** 计数器（跨组件读写验证，非持久化） */
  const counter = ref(0)

  function increment() {
    counter.value += 1
  }

  return { appName, counter, increment }
})
