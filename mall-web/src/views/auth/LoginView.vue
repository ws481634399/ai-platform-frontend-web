<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMemberStore } from '@/stores/member'
import { safeRedirect } from '@/router/access-policy'
import { normalizeUsername, validateMemberCredential } from '@/utils/member-form'
import { resolveErrorMessage } from '@/utils/http-error'

const route = useRoute()
const router = useRouter()
const member = useMemberStore()

// 注册成功跳回时可经 query.username 预填
const username = ref(typeof route.query.username === 'string' ? route.query.username : '')
const password = ref('')
const loading = ref(false)
const errorMessage = ref('')

async function submit() {
  errorMessage.value = ''
  const hint = validateMemberCredential({ username: username.value, password: password.value })
  if (hint) {
    errorMessage.value = hint
    return
  }
  loading.value = true
  try {
    await member.login({
      username: normalizeUsername(username.value),
      password: password.value,
    })
    // AC-015：登录后回跳原页面；redirect 仅接受同源相对路径
    await router.replace(safeRedirect(route.query.redirect))
  } catch (error) {
    errorMessage.value = resolveErrorMessage(error, '登录失败，请稍后重试')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <section class="auth-view">
    <form class="auth-view__card" @submit.prevent="submit">
      <h1 class="auth-view__title">会员登录</h1>

      <label class="auth-view__field">
        <span>用户名</span>
        <input v-model="username" type="text" autocomplete="username" data-testid="login-username" />
      </label>

      <label class="auth-view__field">
        <span>密码</span>
        <input
          v-model="password"
          type="password"
          autocomplete="current-password"
          data-testid="login-password"
        />
      </label>

      <p v-if="errorMessage" class="auth-view__error" data-testid="login-error">{{ errorMessage }}</p>

      <button
        type="submit"
        class="auth-view__submit"
        :disabled="loading"
        data-testid="login-submit"
      >
        {{ loading ? '登录中…' : '登录' }}
      </button>

      <p class="auth-view__hint">
        还没有账号？<router-link to="/register" data-testid="login-to-register">立即注册</router-link>
      </p>
    </form>
  </section>
</template>

<style scoped>
.auth-view {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 24px;
}

.auth-view__card {
  width: 360px;
  max-width: 100%;
  padding: 24px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.auth-view__title {
  margin: 0 0 16px;
  font-size: 20px;
}

.auth-view__field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
  font-size: 14px;
}

.auth-view__field input {
  padding: 8px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
}

.auth-view__error {
  margin: 0 0 12px;
  color: #dc2626;
  font-size: 13px;
}

.auth-view__submit {
  width: 100%;
  padding: 8px 16px;
  color: #fff;
  background: #2563eb;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.auth-view__submit:disabled {
  opacity: 0.6;
  cursor: wait;
}

.auth-view__hint {
  margin: 12px 0 0;
  font-size: 13px;
  color: #6b7280;
}
</style>
