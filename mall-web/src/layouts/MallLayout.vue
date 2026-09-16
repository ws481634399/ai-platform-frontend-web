<script setup lang="ts">
import { useAppStore } from '@/stores/app'
import { useMemberStore } from '@/stores/member'
import { useCartStore } from '@/stores/cart'

const appStore = useAppStore()
const member = useMemberStore()
const cart = useCartStore()

async function handleLogout() {
  await member.logout()
}
</script>

<template>
  <div class="mall-layout">
    <header class="mall-layout__header">
      <span class="mall-layout__title">{{ appStore.appName }}</span>
      <nav
        class="mall-layout__user"
        data-testid="mall-user-area"
      >
        <router-link
          to="/cart"
          class="mall-layout__cart-link"
          data-testid="mall-cart-link"
        >
          购物车
          <span
            v-if="cart.badgeCount > 0"
            class="mall-layout__cart-badge"
            data-testid="mall-cart-badge"
          >{{ cart.badgeCount }}</span>
        </router-link>
        <template v-if="member.isAuthenticated">
          <router-link
            to="/member/profile"
            class="mall-layout__profile-link"
            data-testid="mall-profile-link"
          >
            个人中心
          </router-link>
          <router-link
            to="/member/addresses"
            class="mall-layout__address-link"
            data-testid="mall-address-link"
          >
            收货地址
          </router-link>
          <span
            class="mall-layout__member"
            data-testid="mall-member-id"
          >
            会员 #{{ member.memberId }}
          </span>
          <button
            type="button"
            data-testid="mall-logout"
            @click="handleLogout"
          >
            退出
          </button>
        </template>
        <template v-else>
          <router-link
            to="/login"
            data-testid="mall-login-link"
          >
            登录
          </router-link>
          <router-link
            to="/register"
            data-testid="mall-register-link"
          >
            注册
          </router-link>
        </template>
      </nav>
    </header>
    <main class="mall-layout__main">
      <router-view />
    </main>
    <footer class="mall-layout__footer">
      © 2026 AI Mall · 占位页脚（M1 视觉设计替换）
    </footer>
  </div>
</template>

<style scoped>
.mall-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.mall-layout__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  border-bottom: 1px solid #e5e7eb;
}

.mall-layout__title {
  font-size: 18px;
  font-weight: 600;
}

.mall-layout__user {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
}

.mall-layout__profile-link,
.mall-layout__address-link {
  color: #2563eb;
  text-decoration: none;
}

.mall-layout__cart-link {
  color: #2563eb;
  text-decoration: none;
  position: relative;
}

.mall-layout__cart-badge {
  position: absolute;
  top: -8px;
  right: -12px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  background: #dc2626;
  color: #fff;
  border-radius: 8px;
  font-size: 11px;
  line-height: 16px;
  text-align: center;
}

.mall-layout__member {
  color: #374151;
}

.mall-layout__user button {
  padding: 4px 12px;
  cursor: pointer;
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
