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
        <!-- 分类入口：横向 chip 列表 -->
        <nav
          v-if="data.categoryEntries.length"
          class="home__categories"
          data-testid="home-categories"
          aria-label="商品分类"
        >
          <button
            v-for="c in data.categoryEntries"
            :key="c.id"
            type="button"
            class="home__category"
            :data-testid="`category-${c.id}`"
            @click="goCategory(c.id)"
          >
            <span class="home__category-name">{{ c.name }}</span>
          </button>
        </nav>

        <!-- Banner -->
        <BannerSlot :banners="data.banners" />

        <!-- 新品 -->
        <section
          v-if="data.newArrivals.length"
          class="home__section"
        >
          <header class="home__section-header">
            <h2 class="home__section-title">
              新品上架
            </h2>
            <router-link
              to="/products?sort=newest"
              class="home__section-more"
            >
              查看全部
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
          class="home__section"
        >
          <header class="home__section-header">
            <h2 class="home__section-title">
              为你推荐
            </h2>
            <router-link
              to="/products"
              class="home__section-more"
            >
              查看全部
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

/* ── 分类 chip 列表 ─────────────────────── */
.home__categories {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-bottom: var(--space-6);
}

.home__category {
  padding: var(--space-2) var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-pill);
  background: var(--color-bg);
  cursor: pointer;
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  font-weight: 500;
  transition: all var(--transition-fast);
}
.home__category:hover {
  border-color: var(--color-text);
  color: var(--color-text);
  background: var(--color-bg-subtle);
}
.home__category:focus-visible {
  outline: 2px solid var(--color-border-focus);
  outline-offset: 2px;
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
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: var(--space-4);
}
.home__section-title {
  margin: 0;
  font-size: var(--text-xl);
  font-weight: 700;
  color: var(--color-text);
  letter-spacing: var(--tracking-tight);
}
.home__section-more {
  font-size: var(--text-sm);
  color: var(--color-text-tertiary);
  font-weight: 500;
}
.home__section-more:hover {
  color: var(--color-accent);
}

/* ── 商品网格 ──────────────────────────── */
.home__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--space-4);
}

/* ── 响应式 ────────────────────────────── */
@media (max-width: 640px) {
  .home__grid {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-3);
  }
  .home__section-title {
    font-size: var(--text-lg);
  }
}
</style>
