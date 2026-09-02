<script setup lang="ts">
import { useAppStore } from '@/stores/app'

const appStore = useAppStore()
</script>

<template>
  <div class="mall-layout">
    <header class="mall-layout__header">
      <span class="mall-layout__title">{{ appStore.appName }}</span>
    </header>
    <main class="mall-layout__main">
      <router-view />
    </main>
    <footer class="mall-layout__footer">© 2026 AI Mall · 占位页脚（M1 视觉设计替换）</footer>
  </div>
</template>

<style scoped>
.mall-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.mall-layout__header {
  padding: 12px 24px;
  border-bottom: 1px solid #e5e7eb;
}

.mall-layout__title {
  font-size: 18px;
  font-weight: 600;
}

.mall-layout__main {
  flex: 1;
  padding: 24px;
}

.mall-layout__footer {
  padding: 12px 24px;
  border-top: 1px solid #e5e7eb;
  color: #6b7280;
  font-size: 12px;
  text-align: center;
}
</style>
