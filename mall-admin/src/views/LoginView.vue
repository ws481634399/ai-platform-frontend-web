<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const username = ref('')
const password = ref('')
const loading = ref(false)
const errorMessage = ref('')
const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

async function submit() {
  errorMessage.value = ''
  if (username.value.trim().length < 3 || password.value.length < 8) {
    errorMessage.value = '请输入有效的用户名和密码'
    return
  }
  loading.value = true
  try {
    await auth.login({ username: username.value.trim(), password: password.value })
    await router.replace(typeof route.query.redirect === 'string' ? route.query.redirect : '/')
  } catch { errorMessage.value = '用户名或密码错误' }
  finally { loading.value = false }
}
</script>

<template>
  <section class="login-view">
    <el-card class="login-view__card" header="管理后台登录">
      <el-form label-width="80px" @submit.prevent="submit">
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
        <el-alert v-if="errorMessage" :title="errorMessage" type="error" :closable="false" />
        <el-button type="primary" native-type="submit" :loading="loading" data-testid="login-submit">登录</el-button>
      </el-form>
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
