<script setup lang="ts">
import { ref } from 'vue'

const username = ref('')
const password = ref('')
</script>

<template>
  <section class="login-view">
    <el-card class="login-view__card" header="登录页（占位）">
      <el-form label-width="80px" @submit.prevent>
        <el-form-item label="用户名">
          <el-input v-model="username" placeholder="请输入用户名（占位）" data-testid="login-username" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input
            v-model="password"
            type="password"
            placeholder="请输入密码（占位）"
            data-testid="login-password"
          />
        </el-form-item>
        <el-button type="primary" data-testid="login-submit">提交</el-button>
      </el-form>
      <p class="login-view__hint">M0 仅验证 Element Plus 组件渲染，不调用接口、不实现凭据逻辑</p>
    </el-card>
  </section>
</template>

<style scoped>
.login-view {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
}

.login-view__card {
  width: 360px;
}

.login-view__hint {
  margin-top: 12px;
  color: #6b7280;
  font-size: 12px;
}
</style>
