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
    <div class="auth-view__brand">
      <span class="auth-view__brand-mark">AI</span>
      <span class="auth-view__brand-name">AI Mall</span>
    </div>
    <form
      class="auth-view__card"
      @submit.prevent="submit"
    >
      <h1 class="auth-view__title">
        会员登录
      </h1>
      <p class="auth-view__subtitle">登录后享受会员价与购物车同步</p>

      <label class="auth-view__field">
        <span class="auth-view__label">用户名</span>
        <input
          v-model="username"
          type="text"
          autocomplete="username"
          class="auth-view__input"
          data-testid="login-username"
        >
      </label>

      <label class="auth-view__field">
        <span class="auth-view__label">密码</span>
        <input
          v-model="password"
          type="password"
          autocomplete="current-password"
          class="auth-view__input"
          data-testid="login-password"
        >
      </label>

      <p
        v-if="errorMessage"
        class="auth-view__error"
        data-testid="login-error"
        role="alert"
      >
        {{ errorMessage }}
      </p>

      <button
        type="submit"
        class="auth-view__submit"
        :disabled="loading"
        data-testid="login-submit"
      >
        {{ loading ? '登录中…' : '登录' }}
      </button>

      <p class="auth-view__hint">
        还没有账号？<router-link
          to="/register"
          data-testid="login-to-register"
        >
          立即注册
        </router-link>
      </p>
    </form>
  </section>
</template>

<style scoped>
.auth-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-8) var(--space-4);
}

.auth-view__brand {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-6);
  font-weight: 700;
  font-size: var(--text-xl);
  color: var(--color-text);
}
.auth-view__brand-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  background: var(--color-primary);
  color: var(--color-text-on-primary);
  font-size: var(--text-sm);
  font-weight: 700;
}
.auth-view__brand-name {
  letter-spacing: var(--tracking-tight);
}

.auth-view__card {
  width: 360px;
  max-width: 100%;
  padding: var(--space-6);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  box-shadow: var(--shadow-sm);
}

.auth-view__title {
  margin: 0;
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--color-text);
  letter-spacing: var(--tracking-tight);
}
.auth-view__subtitle {
  margin: 0 0 var(--space-2);
  color: var(--color-text-tertiary);
  font-size: var(--text-sm);
}

.auth-view__field {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  font-size: var(--text-sm);
}
.auth-view__label {
  color: var(--color-text-secondary);
  font-weight: 500;
}
.auth-view__input {
  padding: var(--space-3) var(--space-3);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
  background: var(--color-bg);
  color: var(--color-text);
  font-size: var(--text-base);
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}
.auth-view__input::placeholder {
  color: var(--color-text-muted);
}
.auth-view__input:focus {
  outline: none;
  border-color: var(--color-border-focus);
  box-shadow: var(--shadow-focus);
}

.auth-view__error {
  margin: 0;
  padding: var(--space-2) var(--space-3);
  background: var(--color-danger-bg);
  color: var(--color-danger);
  font-size: var(--text-sm);
  border-radius: var(--radius-md);
  border-left: 3px solid var(--color-danger);
}

.auth-view__submit {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  color: var(--color-text-on-primary);
  background: var(--color-primary);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: var(--text-md);
  font-weight: 500;
  transition: background var(--transition-fast);
}
.auth-view__submit:hover:not(:disabled) {
  background: var(--color-primary-hover);
}
.auth-view__submit:disabled {
  opacity: 0.6;
  cursor: wait;
}

.auth-view__hint {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-text-tertiary);
  text-align: center;
}
.auth-view__hint a {
  color: var(--color-accent);
  font-weight: 500;
}
</style>
