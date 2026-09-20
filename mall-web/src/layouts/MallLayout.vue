<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { useMemberStore } from '@/stores/member'
import { useCartStore } from '@/stores/cart'
import { useFeaturesStore } from '@/stores/features'

const appStore = useAppStore()
const member = useMemberStore()
const cart = useCartStore()
const features = useFeaturesStore()
const router = useRouter()

const keyword = ref('')

async function handleLogout() {
  // logout 接口失败时本地态仍会清理（store 内 finally），这里同样保证跳回首页，
  // 避免会员停留在 /member/* 等受保护页面看到空数据或触发未认证请求
  try {
    await member.logout()
  } finally {
    await router.push('/')
  }
}

function submitSearch() {
  const k = keyword.value.trim()
  if (!k) {
    router.push('/products')
    return
  }
  router.push({ path: '/products', query: { keyword: k } })
}

const isAuthed = computed(() => member.isAuthenticated)
</script>

<template>
  <div class="layout">
    <header class="header">
      <div class="header__inner">
        <router-link to="/" class="header__brand" data-testid="mall-title">
          <span class="header__brand-mark">
            <svg class="header__brand-spark" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M12 2.5l1.9 6.2 6.1 1.8-6.1 1.9L12 18.7l-1.9-6.3L4 10.5l6.1-1.8L12 2.5z"
                fill="currentColor"
                opacity="0.95"
              />
              <path
                d="M19 14.5l.9 2.8 2.8.9-2.8.9-.9 2.8-.9-2.8-2.8-.9 2.8-.9.9-2.8z"
                fill="currentColor"
              />
            </svg>
          </span>
          <span class="header__brand-name">{{ appStore.appName }}</span>
        </router-link>

        <form class="header__search" data-testid="mall-search-form" @submit.prevent="submitSearch">
          <svg class="header__search-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <circle cx="9" cy="9" r="6" stroke="currentColor" stroke-width="1.8" />
            <path
              d="M13.8 13.8L18 18"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
            />
          </svg>
          <input
            v-model="keyword"
            type="search"
            class="header__search-input"
            placeholder="搜索商品 / 品牌 / 规格"
            aria-label="搜索商品"
          />
          <button type="submit" class="header__search-btn" aria-label="搜索">
            <span class="header__search-btn-label">搜索</span>
          </button>
        </form>

        <nav class="header__nav" data-testid="mall-user-area">
          <!-- FE-504：搜索入口受 search.enabled 控制，未加载/缺键默认开放（fail-open） -->
          <router-link
            v-if="features.hasFeature('search.enabled', true)"
            to="/search"
            class="header__nav-link"
            data-testid="mall-search-link"
          >
            搜索
          </router-link>

          <!-- CHG-0024：AI 导购入口受 ai.shopping.enabled 控制（显隐仅体验层，安全边界在后端 fail-closed） -->
          <router-link
            v-if="features.hasFeature('ai.shopping.enabled', true)"
            to="/ai/assistant"
            class="header__nav-link"
            data-testid="mall-ai-link"
          >
            AI 助手
          </router-link>

          <!-- CHG-0024：AI 商品对比入口受 ai.compare.enabled 控制（显隐仅体验层，安全边界在后端 fail-closed） -->
          <router-link
            v-if="features.hasFeature('ai.compare.enabled', true)"
            to="/ai/compare"
            class="header__nav-link"
            data-testid="mall-compare-link"
          >
            商品对比
          </router-link>

          <!-- CHG-0024：AI 订单助手入口受 ai.order-assistant.enabled 控制且仅会员可见 -->
          <router-link
            v-if="features.hasFeature('ai.order-assistant.enabled', true) && isAuthed"
            to="/ai/orders"
            class="header__nav-link"
            data-testid="mall-order-assistant-link"
          >
            订单助手
          </router-link>

          <!-- CHG-0024：智能客服入口受 ai.rag.enabled 控制（显隐仅体验层，安全边界在后端 fail-closed） -->
          <router-link
            v-if="features.hasFeature('ai.rag.enabled', true)"
            to="/ai/support"
            class="header__nav-link"
            data-testid="mall-support-link"
          >
            智能客服
          </router-link>

          <router-link
            to="/cart"
            class="header__nav-link header__cart"
            data-testid="mall-cart-link"
          >
            <svg class="header__cart-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M3 4h2l2.2 12.2a1.6 1.6 0 0 0 1.6 1.3h7.9a1.6 1.6 0 0 0 1.6-1.3L20 8H6"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <circle cx="10.5" cy="20.2" r="1.3" fill="currentColor" />
              <circle cx="17" cy="20.2" r="1.3" fill="currentColor" />
            </svg>
            <span>购物车</span>
            <span
              v-if="cart.badgeCount > 0"
              class="header__cart-badge"
              data-testid="mall-cart-badge"
              >{{ cart.badgeCount }}</span
            >
          </router-link>

          <template v-if="isAuthed">
            <router-link to="/orders" class="header__nav-link" data-testid="mall-orders-link">
              我的订单
            </router-link>
            <div class="header__dropdown">
              <router-link
                to="/member/profile"
                class="header__nav-link header__nav-link--member"
                data-testid="mall-profile-link"
              >
                <span class="header__avatar">
                  {{ String(member.memberId).slice(-2) }}
                </span>
                会员 #{{ member.memberId }}
              </router-link>
              <div class="header__dropdown-menu">
                <router-link
                  to="/member/profile"
                  class="header__dropdown-item"
                  data-testid="mall-profile-link-dropdown"
                >
                  个人中心
                </router-link>
                <router-link
                  to="/member/addresses"
                  class="header__dropdown-item"
                  data-testid="mall-address-link"
                >
                  收货地址
                </router-link>
                <button
                  type="button"
                  class="header__dropdown-item header__dropdown-item--btn"
                  data-testid="mall-logout"
                  @click="handleLogout"
                >
                  退出登录
                </button>
              </div>
            </div>
          </template>
          <template v-else>
            <router-link to="/login" class="header__nav-link" data-testid="mall-login-link">
              登录
            </router-link>
            <router-link
              to="/register"
              class="header__nav-link header__nav-link--primary"
              data-testid="mall-register-link"
            >
              注册
            </router-link>
          </template>
        </nav>
      </div>
    </header>

    <main class="main">
      <router-view />
    </main>

    <footer class="footer">
      <div class="footer__inner">
        <div class="footer__brand">
          <span class="footer__brand-mark">AI</span>
          <div class="footer__brand-text">
            <strong>{{ appStore.appName }}</strong>
            <span>AI 智能电商 · 品质保障</span>
          </div>
        </div>
        <span class="footer__copy">© 2026 {{ appStore.appName }}</span>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: transparent;
}

/* ── Header：玻璃拟态 ───────────────────── */
.header {
  position: sticky;
  top: 0;
  z-index: 50;
  height: var(--header-height);
  background: rgba(255, 250, 246, 0.72);
  backdrop-filter: blur(18px) saturate(1.8);
  -webkit-backdrop-filter: blur(18px) saturate(1.8);
  border-bottom: 1px solid rgba(255, 61, 119, 0.12);
  box-shadow: 0 4px 24px -12px rgba(214, 40, 110, 0.18);
}

.header__inner {
  max-width: var(--content-max-width);
  margin: 0 auto;
  padding: 0 var(--content-padding);
  height: 100%;
  display: flex;
  align-items: center;
  gap: var(--space-6);
}

.header__brand {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  color: var(--color-text);
  font-weight: 800;
  font-size: var(--text-lg);
  letter-spacing: var(--tracking-tight);
  flex-shrink: 0;
}
.header__brand:hover {
  color: var(--color-text);
}

.header__brand-mark {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 12px;
  background: var(--gradient-brand);
  background-size: 180% 180%;
  color: #fff;
  font-size: var(--text-sm);
  font-weight: 800;
  letter-spacing: 0.02em;
  box-shadow: var(--shadow-glow-brand);
  animation: brand-pan 7s ease-in-out infinite;
  overflow: hidden;
}
.header__brand-mark::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    115deg,
    transparent 30%,
    rgba(255, 255, 255, 0.55) 48%,
    transparent 62%
  );
  transform: translateX(-130%) skewX(-18deg);
  animation: shine-sweep 4.6s var(--ease-out-expo) infinite;
}
.header__brand-spark {
  width: 21px;
  height: 21px;
  filter: drop-shadow(0 1px 2px rgba(120, 0, 50, 0.35));
}

.header__brand-name {
  white-space: nowrap;
  color: var(--color-text);
}

/* ── Search：悬浮胶囊 ───────────────────── */
.header__search {
  flex: 1;
  display: flex;
  align-items: center;
  max-width: 500px;
  min-width: 0;
  height: 42px;
  padding: 0 5px 0 16px;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-pill);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: var(--shadow-xs);
  transition:
    border-color var(--transition-fast),
    box-shadow var(--transition-fast),
    transform var(--transition-fast);
}
.header__search:focus-within {
  border-color: transparent;
  box-shadow:
    var(--shadow-focus),
    0 8px 22px -10px rgba(255, 61, 119, 0.35);
  transform: translateY(-1px);
}

.header__search-icon {
  width: 17px;
  height: 17px;
  color: var(--color-text-tertiary);
  flex-shrink: 0;
  transition: color var(--transition-fast);
}
.header__search:focus-within .header__search-icon {
  color: var(--color-primary);
}

.header__search-input {
  flex: 1;
  min-width: 0;
  margin: 0 var(--space-3);
  border: none;
  background: transparent;
  font-size: var(--text-base);
  color: var(--color-text);
}
.header__search-input:focus {
  outline: none;
}
.header__search-input::placeholder {
  color: var(--color-text-muted);
}
/* 去掉 webkit 搜索框默认清除按钮样式冲突 */
.header__search-input::-webkit-search-cancel-button {
  appearance: none;
}

.header__search-btn {
  position: relative;
  flex-shrink: 0;
  height: 32px;
  padding: 0 var(--space-5);
  border: none;
  border-radius: var(--radius-pill);
  background: var(--gradient-brand);
  background-size: 160% 160%;
  color: #fff;
  font-size: var(--text-sm);
  font-weight: 700;
  overflow: hidden;
  box-shadow: 0 6px 16px -6px rgba(255, 61, 119, 0.65);
  transition:
    transform var(--transition-fast),
    box-shadow var(--transition-fast);
}
.header__search-btn::after {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  width: 40%;
  background: linear-gradient(115deg, transparent, rgba(255, 255, 255, 0.5), transparent);
  transform: translateX(-160%) skewX(-18deg);
  transition: transform 0.5s var(--ease-out-expo);
}
.header__search-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 22px -8px rgba(255, 61, 119, 0.7);
}
.header__search-btn:hover::after {
  transform: translateX(340%) skewX(-18deg);
}

/* ── Nav ─────────────────────────────── */
.header__nav {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  flex-shrink: 0;
  font-size: var(--text-sm);
}

.header__nav-link {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-pill);
  color: var(--color-text-secondary);
  font-weight: 600;
  white-space: nowrap;
  transition:
    color var(--transition-fast),
    background var(--transition-fast);
}
.header__nav-link::after {
  content: '';
  position: absolute;
  left: 50%;
  right: 50%;
  bottom: 2px;
  height: 2.5px;
  border-radius: var(--radius-pill);
  background: var(--gradient-sunset);
  transition:
    left var(--transition),
    right var(--transition);
}
.header__nav-link:hover {
  color: var(--color-primary);
  background: var(--color-danger-bg);
}
.header__nav-link:hover::after,
.header__nav-link.router-link-active::after {
  left: 14px;
  right: 14px;
}
.header__nav-link.router-link-active {
  color: var(--color-primary);
}

.header__nav-link--primary {
  margin-left: var(--space-1);
  padding: var(--space-2) var(--space-5);
  color: #fff;
  background: var(--gradient-brand);
  background-size: 160% 160%;
  border-radius: var(--radius-pill);
  font-weight: 700;
  box-shadow: 0 8px 20px -8px rgba(255, 61, 119, 0.7);
  transition:
    transform var(--transition-fast),
    box-shadow var(--transition-fast);
}
.header__nav-link--primary::after {
  display: none;
}
.header__nav-link--primary:hover {
  color: #fff;
  background: var(--gradient-brand);
  transform: translateY(-2px) scale(1.03);
  box-shadow: 0 12px 26px -8px rgba(255, 61, 119, 0.8);
}

.header__cart-icon {
  width: 18px;
  height: 18px;
}

.header__cart-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 19px;
  height: 19px;
  padding: 0 5px;
  background: var(--gradient-sunset);
  color: #fff;
  border-radius: var(--radius-pill);
  border: 2px solid rgba(255, 250, 246, 0.9);
  font-size: var(--text-xs);
  font-weight: 800;
  line-height: 1;
  animation: badge-pulse 2.2s ease-out infinite;
}

.header__avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--gradient-berry);
  color: #fff;
  font-size: 10px;
  font-weight: 800;
}

/* ── 会员下拉 ─────────────────────────── */
.header__dropdown {
  position: relative;
}
.header__dropdown-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 168px;
  padding: var(--space-2);
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border: 1px solid rgba(255, 61, 119, 0.14);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  opacity: 0;
  visibility: hidden;
  transform: translateY(-6px) scale(0.97);
  transform-origin: top right;
  transition:
    opacity var(--transition-fast),
    transform var(--transition-fast),
    visibility var(--transition-fast);
}
.header__dropdown:hover .header__dropdown-menu,
.header__dropdown:focus-within .header__dropdown-menu {
  opacity: 1;
  visibility: visible;
  transform: translateY(0) scale(1);
}
.header__dropdown-item {
  display: block;
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
  font-weight: 500;
  text-align: left;
  transition:
    background var(--transition-fast),
    color var(--transition-fast);
}
.header__dropdown-item:hover {
  background: var(--color-danger-bg);
  color: var(--color-primary);
}
.header__dropdown-item--btn {
  background: transparent;
  border: none;
  cursor: pointer;
}

/* ── Main ─────────────────────────────── */
.main {
  flex: 1;
  width: 100%;
  max-width: var(--content-max-width);
  margin: 0 auto;
  padding: var(--space-8) var(--content-padding) var(--space-16);
}

/* ── Footer：深梅渐变 ──────────────────── */
.footer {
  position: relative;
  overflow: hidden;
  background: var(--gradient-dark);
  padding: var(--space-10) var(--content-padding);
}
.footer::before,
.footer::after {
  content: '';
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  pointer-events: none;
}
.footer::before {
  width: 320px;
  height: 320px;
  left: -90px;
  top: -160px;
  background: rgba(255, 61, 119, 0.35);
}
.footer::after {
  width: 360px;
  height: 360px;
  right: -120px;
  bottom: -220px;
  background: rgba(24, 215, 224, 0.22);
}
.footer__inner {
  position: relative;
  max-width: var(--content-max-width);
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-4);
  flex-wrap: wrap;
}
.footer__brand {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}
.footer__brand-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: var(--gradient-brand);
  color: #fff;
  font-weight: 800;
  box-shadow: var(--shadow-glow-brand);
}
.footer__brand-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.footer__brand-text strong {
  color: var(--color-text-on-dark);
  font-size: var(--text-md);
}
.footer__brand-text span {
  color: var(--color-text-on-dark-muted);
  font-size: var(--text-xs);
}
.footer__copy {
  color: var(--color-text-on-dark-muted);
  font-size: var(--text-xs);
}

/* ── 响应式 ─── */
@media (max-width: 768px) {
  .header__inner {
    gap: var(--space-3);
    padding: 0 var(--space-3);
  }
  .header__search {
    display: none;
  }
  .header__brand-name {
    display: none;
  }
  .main {
    padding: var(--space-5) var(--space-3) var(--space-12);
  }
}

@media (max-width: 1024px) and (min-width: 769px) {
  .header__search {
    max-width: 280px;
  }
}
</style>
