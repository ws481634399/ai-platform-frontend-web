<script setup lang="ts">
import { ref } from 'vue'

import http from '@/api/http'
import { useAppStore } from '@/stores/app'

const appStore = useAppStore()

// HTTP /__ping 验证状态（AC-09：成功/错误双路径可观测）
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
</script>

<template>
  <section class="home-view">
    <h1>{{ appStore.appName }}</h1>
    <p class="home-view__hint">M0 工程基线验证页（无业务逻辑）</p>

    <div class="home-view__card">
      <h2>Pinia 验证</h2>
      <p>计数器：<strong data-testid="counter-value">{{ appStore.counter }}</strong></p>
      <button type="button" data-testid="counter-btn" @click="appStore.increment()">+1</button>
    </div>

    <div class="home-view__card">
      <h2>HTTP 验证</h2>
      <button type="button" :disabled="pingLoading" data-testid="ping-btn" @click="handlePing">
        发起 /__ping 请求
      </button>
      <p v-if="pingLoading">请求中…</p>
      <p v-else-if="pingResult" class="home-view__success" data-testid="ping-result">
        响应：{{ pingResult }}
      </p>
      <p v-else-if="pingError" class="home-view__error" data-testid="ping-error">
        {{ pingError }}
      </p>
    </div>
  </section>
</template>

<style scoped>
.home-view__card {
  margin-top: 16px;
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  max-width: 480px;
}

.home-view__hint {
  color: #6b7280;
}

.home-view__success {
  color: #16a34a;
}

.home-view__error {
  color: #dc2626;
}

button {
  padding: 6px 16px;
  cursor: pointer;
}
</style>
