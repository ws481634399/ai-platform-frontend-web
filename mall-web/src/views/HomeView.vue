<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { catalogApi, type HomeView as HomeData } from '@/api/catalog'
import { resolveErrorMessage } from '@/utils/http-error'
import StateView from '@/components/StateView.vue'
import ProductCard from '@/components/ProductCard.vue'
import BannerSlot from '@/components/BannerSlot.vue'

const router = useRouter()

const loading = ref(true)
const error = ref('')
const data = ref<HomeData | null>(null)

async function loadHome() {
  loading.value = true
  error.value = ''
  try {
    data.value = await catalogApi.getHome()
  } catch (e) {
    error.value = resolveErrorMessage(e, '首页加载失败，请稍后重试')
    data.value = null
  } finally {
    loading.value = false
  }
}

function goCategory(categoryId: string) {
  router.push(`/products?categoryId=${categoryId}`)
}

function isEmpty(): boolean {
  if (!data.value) return true
  const d = data.value
  return d.categoryEntries.length === 0 && d.newArrivals.length === 0 && d.recommends.length === 0
}

/**
 * 滚动入场指令：进入视口加 is-visible；不支持 IO / reduced-motion 时直接可见
 * （reduced-motion 下由 tokens.css 的媒体查询保证 opacity:1）。
 */
const vReveal = {
  mounted(el: HTMLElement) {
    if (typeof IntersectionObserver === 'undefined') {
      el.classList.add('is-visible')
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            el.classList.add('is-visible')
            io.disconnect()
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
    )
    io.observe(el)
  },
}

onMounted(loadHome)
</script>

<template>
  <section class="home">
    <StateView
      :loading="loading"
      :error="error"
      :is-empty="isEmpty()"
      @retry="loadHome"
    >
      <template v-if="data">
        <!-- 分类入口：彩色渐变磁贴 -->
        <nav
          v-if="data.categoryEntries.length"
          class="home__categories"
          data-testid="home-categories"
          aria-label="商品分类"
        >
          <button
            v-for="(c, idx) in data.categoryEntries"
            :key="c.id"
            type="button"
            class="home__category"
            :data-testid="`category-${c.id}`"
            :style="{ animationDelay: `${Math.min(idx, 9) * 55}ms` }"
            @click="goCategory(c.id)"
          >
            <span
              class="home__category-watermark"
              aria-hidden="true"
            >{{ c.name.slice(0, 1) }}</span>
            <svg
              class="home__category-arrow"
              viewBox="0 0 20 20"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M5 10h9m0 0l-4-4m4 4l-4 4"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            <span class="home__category-name">{{ c.name }}</span>
          </button>
        </nav>

        <!-- Banner -->
        <BannerSlot :banners="data.banners" />

        <!-- 新品 -->
        <section
          v-if="data.newArrivals.length"
          v-reveal
          class="home__section reveal"
        >
          <header class="home__section-header">
            <h2 class="home__section-title">
              <span class="home__section-diamond" />
              新品上架
            </h2>
            <router-link
              to="/products?sort=newest"
              class="home__section-more"
            >
              查看全部
              <svg
                viewBox="0 0 20 20"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M5 10h9m0 0l-4-4m4 4l-4 4"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </router-link>
          </header>
          <div class="home__grid">
            <ProductCard
              v-for="p in data.newArrivals"
              :key="p.id"
              :product="p"
            />
          </div>
        </section>

        <!-- 推荐 -->
        <section
          v-if="data.recommends.length"
          v-reveal
          class="home__section reveal"
        >
          <header class="home__section-header">
            <h2 class="home__section-title">
              <span class="home__section-diamond home__section-diamond--aqua" />
              为你推荐
            </h2>
            <router-link
              to="/products"
              class="home__section-more"
            >
              查看全部
              <svg
                viewBox="0 0 20 20"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M5 10h9m0 0l-4-4m4 4l-4 4"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </router-link>
          </header>
          <div class="home__grid">
            <ProductCard
              v-for="p in data.recommends"
              :key="p.id"
              :product="p"
            />
          </div>
        </section>
      </template>
    </StateView>
  </section>
</template>

<style scoped>
.home {
  max-width: var(--content-max-width);
  margin: 0 auto;
}

/* ── 分类：彩色渐变磁贴 ──────────────────── */
.home__categories {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(118px, 1fr));
  gap: var(--space-3);
  margin-bottom: var(--space-8);
}

.home__category {
  position: relative;
  display: flex;
  align-items: flex-end;
  height: 84px;
  padding: var(--space-3) var(--space-4);
  border: none;
  border-radius: var(--radius-xl);
  overflow: hidden;
  cursor: pointer;
  color: #fff;
  text-align: left;
  background: var(--gradient-sunset);
  box-shadow: 0 10px 22px -12px rgba(255, 46, 136, 0.55);
  transition: transform var(--transition), box-shadow var(--transition);
  animation: pop-in 0.55s var(--ease-spring) both;
}
/* 轮换 5 套渐变 */
.home__category:nth-child(5n + 1) {
  background: linear-gradient(135deg, #ff9a3d, #ff2e88);
}
.home__category:nth-child(5n + 2) {
  background: linear-gradient(135deg, #ff3d77, #8b5cf6);
  box-shadow: 0 10px 22px -12px rgba(139, 92, 246, 0.55);
}
.home__category:nth-child(5n + 3) {
  background: linear-gradient(135deg, #11b6d4, #0fa968);
  box-shadow: 0 10px 22px -12px rgba(15, 169, 104, 0.5);
}
.home__category:nth-child(5n + 4) {
  background: linear-gradient(135deg, #8b5cf6, #5b3df5);
  box-shadow: 0 10px 22px -12px rgba(91, 61, 245, 0.55);
}
.home__category:nth-child(5n + 5) {
  background: linear-gradient(135deg, #ff7a2f, #ff3d77);
}

.home__category:hover {
  transform: translateY(-5px) rotate(-1.5deg) scale(1.03);
  box-shadow: 0 20px 34px -14px rgba(255, 46, 136, 0.6);
}
.home__category:active {
  transform: translateY(-2px) scale(0.99);
}
.home__category:focus-visible {
  outline: 3px solid var(--color-border-focus);
  outline-offset: 3px;
}

.home__category-watermark {
  position: absolute;
  top: -14px;
  right: 2px;
  font-family: var(--font-display);
  font-size: 76px;
  font-weight: 900;
  line-height: 1;
  color: rgba(255, 255, 255, 0.18);
  pointer-events: none;
  user-select: none;
}

.home__category-arrow {
  position: absolute;
  top: var(--space-3);
  left: var(--space-4);
  width: 16px;
  height: 16px;
  color: rgba(255, 255, 255, 0.85);
  opacity: 0;
  transform: translateX(-6px);
  transition: opacity var(--transition-fast), transform var(--transition-fast);
}
.home__category:hover .home__category-arrow {
  opacity: 1;
  transform: translateX(0);
}

.home__category-name {
  position: relative;
  font-size: var(--text-base);
  font-weight: 800;
  letter-spacing: 0.01em;
  text-shadow: 0 1px 6px rgba(120, 0, 60, 0.3);
}

/* ── 板块 ──────────────────────────────── */
.home__section {
  margin-bottom: var(--space-12);
}
.home__section:last-child {
  margin-bottom: 0;
}

.home__section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-5);
}
.home__section-title {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin: 0;
  font-family: var(--font-display);
  font-size: var(--text-2xl);
  font-weight: 800;
  color: var(--color-text);
  letter-spacing: var(--tracking-tight);
}
.home__section-diamond {
  width: 14px;
  height: 14px;
  border-radius: 4px;
  background: var(--gradient-sunset);
  transform: rotate(45deg);
  box-shadow: 0 4px 10px -2px rgba(255, 46, 136, 0.55);
}
.home__section-diamond--aqua {
  background: var(--gradient-aqua);
  box-shadow: 0 4px 10px -2px rgba(18, 200, 214, 0.55);
}
.home__section-more {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-pill);
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-accent);
  transition: background var(--transition-fast), gap var(--transition-fast);
}
.home__section-more svg {
  width: 15px;
  height: 15px;
  transition: transform var(--transition-fast);
}
.home__section-more:hover {
  background: var(--color-accent-bg);
  color: var(--color-accent-hover);
  gap: var(--space-2);
}
.home__section-more:hover svg {
  transform: translateX(3px);
}

/* ── 商品网格 ──────────────────────────── */
.home__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
  gap: var(--space-5);
}

/* ── 响应式 ────────────────────────────── */
@media (max-width: 640px) {
  .home__categories {
    grid-template-columns: repeat(3, 1fr);
    gap: var(--space-2);
  }
  .home__category {
    height: 68px;
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius-lg);
  }
  .home__category-watermark {
    font-size: 58px;
    top: -10px;
  }
  .home__category-name {
    font-size: var(--text-sm);
  }
  .home__grid {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-3);
  }
  .home__section-title {
    font-size: var(--text-xl);
  }
}
</style>
