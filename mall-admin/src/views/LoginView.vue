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
    <div class="login-view__brand">
      <span class="login-view__brand-mark">AI</span>
      <span class="login-view__brand-name">AI Mall Admin</span>
    </div>
    <form
      class="login-view__card"
      @submit.prevent="submit"
    >
      <h1 class="login-view__title">
        管理后台登录
      </h1>
      <p class="login-view__subtitle">运营管理 · 订单 · 商品 · 库存</p>

      <label class="login-view__field">
        <span class="login-view__label">用户名</span>
        <el-input
          v-model="username"
          placeholder="请输入用户名"
          size="large"
          autocomplete="username"
          data-testid="login-username"
        />
      </label>

      <label class="login-view__field">
        <span class="login-view__label">密码</span>
        <el-input
          v-model="password"
          type="password"
          placeholder="请输入密码"
          size="large"
          autocomplete="current-password"
          show-password
          data-testid="login-password"
          @keyup.enter="submit"
        />
      </label>

      <el-alert
        v-if="errorMessage"
        :title="errorMessage"
        type="error"
        :closable="false"
        show-icon
      />

      <el-button
        type="primary"
        native-type="submit"
        size="large"
        :loading="loading"
        class="login-view__submit"
        data-testid="login-submit"
      >
        {{ loading ? '登录中…' : '登录' }}
      </el-button>
    </form>
  </section>
</template>

<style scoped>
.login-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: var(--admin-space-6);
  background: var(--admin-bg-subtle);
}

.login-view__brand {
  display: flex;
  align-items: center;
  gap: var(--admin-space-2);
  margin-bottom: var(--admin-space-6);
  color: var(--admin-text);
  font-weight: 700;
  font-size: 18px;
}
.login-view__brand-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--admin-radius-md);
  background: var(--admin-text);
  color: var(--admin-bg);
  font-size: 13px;
  font-weight: 700;
}

.login-view__card {
  width: 380px;
  max-width: 100%;
  padding: var(--admin-space-6);
  background: var(--admin-bg);
  border: 1px solid var(--admin-border-light);
  border-radius: var(--admin-radius-lg);
  display: flex;
  flex-direction: column;
  gap: var(--admin-space-4);
  box-shadow: var(--admin-shadow-md);
}

.login-view__title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: var(--admin-text);
}
.login-view__subtitle {
  margin: 0 0 var(--admin-space-2);
  color: var(--admin-text-tertiary);
  font-size: 13px;
}

.login-view__field {
  display: flex;
  flex-direction: column;
  gap: var(--admin-space-2);
  font-size: 14px;
}
.login-view__label {
  color: var(--admin-text-secondary);
  font-weight: 500;
}

.login-view__submit {
  width: 100%;
  margin-top: var(--admin-space-2);
}
</style>
