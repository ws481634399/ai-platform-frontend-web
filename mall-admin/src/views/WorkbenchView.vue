<script setup lang="ts">
import { ref } from 'vue'

import http from '@/api/http'
import { useAppStore } from '@/stores/app'

const appStore = useAppStore()

// HTTP /__ping 验证状态（AC-09：成功/错误统一走拦截器，双路径可观测）
const pingLoading = ref(false)
const pingResult = ref('')
const pingError = ref('')

async function handlePing() {
  pingLoading.value = true
  pingResult.value = ''
  pingError.value = ''
  try {
    const response = await http.get('/__ping')
    const data: unknown = response.data
    pingResult.value = typeof data === 'string' ? data : JSON.stringify(data)
  } catch {
    // 统一错误入口（http.ts Response 拦截器）已记录日志；此处仅向用户展示错误路径结果
    pingError.value = '请求失败（目标不可达，已进入统一错误处理入口）'
  } finally {
    pingLoading.value = false
  }
}

// Element Plus 基础组件渲染验证（AC-10）
const demoInput = ref('')
</script>

<template>
  <section class="workbench-view">
    <h1>{{ appStore.appName }} · 工作台</h1>
    <p data-testid="sidebar-state">
      侧栏折叠状态：{{ appStore.isCollapsed ? '已折叠' : '展开' }}（Pinia 跨组件同步）
    </p>

    <el-card class="workbench-view__card" header="HTTP 验证">
      <el-button type="primary" :loading="pingLoading" data-testid="ping-btn" @click="handlePing">
        发起 /__ping 请求
      </el-button>
      <p v-if="pingLoading">请求中…</p>
      <p v-else-if="pingResult" class="workbench-view__success" data-testid="ping-result">
        响应：{{ pingResult }}
      </p>
      <p v-else-if="pingError" class="workbench-view__error" data-testid="ping-error">
        {{ pingError }}
      </p>
    </el-card>

    <el-card class="workbench-view__card" header="Element Plus 基础组件">
      <el-input v-model="demoInput" placeholder="Element Plus 输入框（渲染验证）" data-testid="demo-input" />
      <el-button class="workbench-view__btn">默认按钮</el-button>
    </el-card>
  </section>
</template>

<style scoped>
.workbench-view__card {
  margin-top: 16px;
  max-width: 560px;
}

.workbench-view__btn {
  margin-left: 12px;
}

.workbench-view__success {
  color: #16a34a;
}

.workbench-view__error {
  color: #dc2626;
}
</style>
