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
          <span class="header__brand-mark">AI</span>
          <span class="header__brand-name">{{ appStore.appName }}</span>
        </router-link>

        <form class="header__search" data-testid="mall-search-form" @submit.prevent="submitSearch">
          <input
            v-model="keyword"
            type="search"
            class="header__search-input"
            placeholder="搜索商品 / 品牌 / 规格"
            aria-label="搜索商品"
          />
          <button type="submit" class="header__search-btn" aria-label="搜索">搜索</button>
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

          <router-link
            to="/cart"
            class="header__nav-link header__cart"
            data-testid="mall-cart-link"
          >
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
        <span>© 2026 {{ appStore.appName }}</span>
        <span class="footer__divider">·</span>
        <span>AI 智能电商 · 品质保障</span>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: var(--color-bg-subtle);
}

/* ── Header ───────────────────────────── */
.header {
  position: sticky;
  top: 0;
  z-index: 50;
  background: var(--color-bg);
  border-bottom: 1px solid var(--color-border);
  height: var(--header-height);
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
  gap: var(--space-2);
  color: var(--color-text);
  font-weight: 700;
  font-size: var(--text-lg);
  letter-spacing: var(--tracking-tight);
  flex-shrink: 0;
}
.header__brand:hover {
  color: var(--color-text);
}

.header__brand-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: var(--radius-md);
  background: var(--color-primary);
  color: var(--color-text-on-primary);
  font-size: var(--text-sm);
  font-weight: 700;
  letter-spacing: 0.02em;
}

.header__brand-name {
  white-space: nowrap;
}

/* ── Search ───────────────────────────── */
.header__search {
  flex: 1;
  display: flex;
  max-width: 480px;
  min-width: 0;
  height: 36px;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-pill);
  background: var(--color-bg);
  overflow: hidden;
  transition:
    border-color var(--transition-fast),
    box-shadow var(--transition-fast);
}
.header__search:focus-within {
  border-color: var(--color-border-focus);
  box-shadow: var(--shadow-focus);
}

.header__search-input {
  flex: 1;
  min-width: 0;
  padding: 0 var(--space-4);
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

.header__search-btn {
  flex-shrink: 0;
  padding: 0 var(--space-5);
  border: none;
  background: var(--color-primary);
  color: var(--color-text-on-primary);
  font-size: var(--text-sm);
  font-weight: 500;
  transition: background var(--transition-fast);
}
.header__search-btn:hover {
  background: var(--color-primary-hover);
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
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  font-weight: 500;
  white-space: nowrap;
  transition:
    color var(--transition-fast),
    background var(--transition-fast);
}
.header__nav-link:hover {
  color: var(--color-text);
  background: var(--color-bg-muted);
}

.header__nav-link--primary {
  background: var(--color-primary);
  color: var(--color-text-on-primary);
  border-radius: var(--radius-pill);
  padding: var(--space-2) var(--space-4);
}
.header__nav-link--primary:hover {
  background: var(--color-primary-hover);
  color: var(--color-text-on-primary);
}

.header__cart {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
}

.header__cart-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 var(--space-1);
  background: var(--color-danger);
  color: #fff;
  border-radius: var(--radius-pill);
  font-size: var(--text-xs);
  font-weight: 600;
  line-height: 1;
}

/* ── 会员下拉 ─────────────────────────── */
.header__dropdown {
  position: relative;
}
.header__dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: var(--space-1);
  min-width: 160px;
  padding: var(--space-1);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  opacity: 0;
  visibility: hidden;
  transform: translateY(-4px);
  transition:
    opacity var(--transition-fast),
    transform var(--transition-fast),
    visibility var(--transition-fast);
}
.header__dropdown:hover .header__dropdown-menu,
.header__dropdown:focus-within .header__dropdown-menu {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}
.header__dropdown-item {
  display: block;
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-sm);
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
  text-align: left;
  transition:
    background var(--transition-fast),
    color var(--transition-fast);
}
.header__dropdown-item:hover {
  background: var(--color-bg-muted);
  color: var(--color-text);
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
  padding: var(--space-6) var(--content-padding);
}

/* ── Footer ──────────────────────────── */
.footer {
  border-top: 1px solid var(--color-border);
  background: var(--color-bg);
  padding: var(--space-4) var(--content-padding);
}
.footer__inner {
  max-width: var(--content-max-width);
  margin: 0 auto;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--space-2);
  color: var(--color-text-tertiary);
  font-size: var(--text-xs);
}
.footer__divider {
  color: var(--color-text-muted);
}

/* ── 响应式：移动端折叠搜索与导航文案 ─── */
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
  .header__nav-link:not(.header__nav-link--primary):not(.header__cart) span,
  .header__nav-link:not(.header__nav-link--primary):not(.header__cart) {
    /* 折叠「我的订单」「登录」等冗余文案，保留主操作 */
  }
  .main {
    padding: var(--space-4) var(--space-3);
  }
}

/* 平板：保留搜索框但缩短 */
@media (max-width: 1024px) and (min-width: 769px) {
  .header__search {
    max-width: 280px;
  }
}
</style>
