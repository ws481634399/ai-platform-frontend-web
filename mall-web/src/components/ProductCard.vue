<script setup lang="ts">
import { useRouter } from 'vue-router'
import PriceText from './PriceText.vue'
import type { ProductCard } from '@/api/catalog'

/**
 * 商品卡片：名称 / 主图懒加载 / 价区 / 点击跳详情。
 * 首页与列表页共用。
 *
 * 设计目标：商品导向、内容优先。
 * - 图片占主视觉（aspect-ratio 4:3，无圆角溢出）
 * - 名称 2 行截断，14-15px
 * - 价格突出，红色 + tabular
 * - 整卡可点，hover 阴影克制
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
  <article
    class="product-card"
    data-testid="product-card"
    tabindex="0"
    @click="goDetail"
    @keydown.enter.prevent="goDetail"
  >
    <div class="product-card__media">
      <img
        v-if="props.product.mainImageUrl"
        :src="props.product.mainImageUrl"
        :alt="props.product.name"
        loading="lazy"
        class="product-card__img"
      >
      <div
        v-else
        class="product-card__img product-card__img--placeholder"
      >
        <span>暂无图片</span>
      </div>
    </div>
    <div class="product-card__body">
      <h3 class="product-card__name">
        {{ props.product.name }}
      </h3>
      <div class="product-card__price">
        <PriceText
          :value="props.product.minPrice"
          class="product-card__price-value"
        />
        <template v-if="props.product.maxPrice && props.product.maxPrice !== props.product.minPrice">
          <span class="product-card__price-sep">–</span>
          <PriceText :value="props.product.maxPrice" />
        </template>
      </div>
    </div>
  </article>
</template>

<style scoped>
.product-card {
  position: relative;
  display: flex;
  flex-direction: column;
  background: var(--color-bg);
  border-radius: var(--radius-lg);
  overflow: hidden;
  cursor: pointer;
  outline: none;
  transition: box-shadow var(--transition), transform var(--transition);
}
.product-card:hover,
.product-card:focus-visible {
  box-shadow: var(--shadow-md);
}
.product-card:focus-visible {
  outline: 2px solid var(--color-border-focus);
  outline-offset: 2px;
}

.product-card__media {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  background: var(--color-bg-muted);
  overflow: hidden;
}

.product-card__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--transition-slow);
}
.product-card:hover .product-card__img {
  transform: scale(1.02);
}

.product-card__img--placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
  font-size: var(--text-sm);
  background: var(--color-bg-muted);
  background-image:
    linear-gradient(45deg, var(--color-border) 25%, transparent 25%, transparent 75%, var(--color-border) 75%),
    linear-gradient(45deg, var(--color-border) 25%, transparent 25%, transparent 75%, var(--color-border) 75%);
  background-size: 20px 20px;
  background-position: 0 0, 10px 10px;
  object-fit: cover;
}

.product-card__body {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-3) var(--space-4);
}

.product-card__name {
  margin: 0;
  font-size: var(--text-base);
  font-weight: 500;
  line-height: var(--leading-tight);
  color: var(--color-text);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: calc(2em * var(--leading-tight));
}

.product-card__price {
  display: flex;
  align-items: baseline;
  gap: var(--space-1);
  font-size: var(--text-md);
  color: var(--color-price);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
.product-card__price-value {
  color: inherit;
  font-weight: 600;
}
.product-card__price-sep {
  color: var(--color-text-muted);
  margin: 0 var(--space-1);
}
</style>
