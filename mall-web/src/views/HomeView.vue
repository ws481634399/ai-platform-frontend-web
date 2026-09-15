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
    <StateView :loading="loading" :error="error" :is-empty="isEmpty()" @retry="loadHome">
      <template v-if="data">
        <!-- 分类入口 -->
        <nav v-if="data.categoryEntries.length" class="home__categories" data-testid="home-categories">
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
        <section v-if="data.newArrivals.length" class="home__section">
          <h2 class="home__section-title">新品上架</h2>
          <div class="home__grid">
            <ProductCard v-for="p in data.newArrivals" :key="p.id" :product="p" />
          </div>
        </section>

        <!-- 推荐 -->
        <section v-if="data.recommends.length" class="home__section">
          <h2 class="home__section-title">为你推荐</h2>
          <div class="home__grid">
            <ProductCard v-for="p in data.recommends" :key="p.id" :product="p" />
          </div>
        </section>
      </template>
    </StateView>
  </section>
</template>

<style scoped>
.home {
  max-width: 960px;
  margin: 0 auto;
}

.home__categories {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.home__category {
  padding: 8px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 20px;
  background: #fff;
  cursor: pointer;
  font-size: 14px;
  color: #374151;
}

.home__category:hover {
  border-color: #6366f1;
  color: #6366f1;
}

.home__section {
  margin-bottom: 24px;
}

.home__section-title {
  margin: 0 0 12px;
  font-size: 18px;
  color: #111827;
}

.home__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
}
</style>
