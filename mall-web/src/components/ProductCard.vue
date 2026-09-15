<script setup lang="ts">
import { useRouter } from 'vue-router'
import PriceText from './PriceText.vue'
import type { ProductCard } from '@/api/catalog'

/**
 * 商品卡片：名称 / 主图懒加载 / 价区 / 点击跳详情。
 * 首页与列表页共用。
 */
const props = defineProps<{
  product: ProductCard
}>()

const router = useRouter()

function goDetail() {
  router.push(`/products/${props.product.id}`)
}
</script>

<template>
  <article class="product-card" data-testid="product-card" @click="goDetail">
    <div class="product-card__image">
      <img
        v-if="props.product.mainImageUrl"
        :src="props.product.mainImageUrl"
        :alt="props.product.name"
        loading="lazy"
      />
      <div v-else class="product-card__image-placeholder">暂无图片</div>
    </div>
    <div class="product-card__body">
      <h3 class="product-card__name">{{ props.product.name }}</h3>
      <div class="product-card__price">
        <PriceText :value="props.product.minPrice" />
        <span v-if="props.product.maxPrice && props.product.maxPrice !== props.product.minPrice" class="product-card__price-sep">
          ~
        </span>
        <PriceText v-if="props.product.maxPrice && props.product.maxPrice !== props.product.minPrice" :value="props.product.maxPrice" />
      </div>
    </div>
  </article>
</template>

<style scoped>
.product-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: box-shadow 0.2s;
}

.product-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.product-card__image {
  width: 100%;
  aspect-ratio: 1 / 1;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
}

.product-card__image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-card__image-placeholder {
  color: #9ca3af;
  font-size: 13px;
}

.product-card__body {
  padding: 8px 12px;
}

.product-card__name {
  margin: 0 0 4px;
  font-size: 14px;
  line-height: 1.4;
  color: #111827;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.product-card__price {
  display: flex;
  align-items: baseline;
  gap: 4px;
  font-size: 14px;
}

.product-card__price-sep {
  color: #9ca3af;
}
</style>
