<script setup lang="ts">
import { useRouter } from 'vue-router'
import PriceText from './PriceText.vue'
import type { ProductCard } from '@/api/catalog'

/**
 * 商品卡片：主图 / 名称 / 价区 / 整卡跳详情。首页与列表页共用。
 *
 * 高级感设计（CHG-0023）：
 * - 静息：微暖渐变底 + 内外双层细描边，营造精致薄边
 * - 悬浮：-8px 抬升、品牌色光晕 + 外描边光环、图片深色渐变遮罩浮现玻璃"查看详情"按钮
 * - 价格：¥ 符号下沉缩小，区间价时高价显示为划线原价
 */
const props = defineProps<{
  product: ProductCard
}>()

const router = useRouter()

function goDetail() {
  router.push(`/products/${props.product.id}`)
}

const hasRange = props.product.maxPrice != null && props.product.maxPrice !== props.product.minPrice
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
        <span class="product-card__placeholder-badge">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M5 8h14l-1 12H6L5 8z"
              stroke="currentColor"
              stroke-width="1.7"
              stroke-linejoin="round"
            />
            <path
              d="M9 10V7a3 3 0 0 1 6 0v3"
              stroke="currentColor"
              stroke-width="1.7"
              stroke-linecap="round"
            />
          </svg>
        </span>
        <span class="product-card__placeholder-text">暂无图片</span>
      </div>

      <!-- 静息：图片底部微渐变，与卡身柔和融合 -->
      <div
        class="product-card__media-fade"
        aria-hidden="true"
      />

      <!-- 悬浮：深色遮罩 + 玻璃查看按钮 -->
      <div
        class="product-card__media-overlay"
        aria-hidden="true"
      >
        <span class="product-card__view-btn">
          查看详情
          <svg
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M5 10h10m0 0l-4-4m4 4l-4 4"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </span>
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
        <span
          v-if="hasRange"
          class="product-card__price-original"
        >
          <PriceText :value="props.product.maxPrice" />
        </span>
      </div>
    </div>
  </article>
</template>

<style scoped>
.product-card {
  position: relative;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #ffffff 0%, #fffaf5 100%);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  overflow: hidden;
  cursor: pointer;
  outline: none;
  /* 双层薄描边：外实边 + 内高光，营造精致卡片边缘 */
  box-shadow:
    inset 0 1px 0 0 rgba(255, 255, 255, 0.7),
    0 1px 3px rgba(255, 61, 119, 0.05);
  transition:
    transform var(--transition),
    box-shadow var(--transition),
    border-color var(--transition);
}
.product-card:hover {
  transform: translateY(-8px);
  border-color: rgba(255, 61, 119, 0.4);
  box-shadow:
    inset 0 1px 0 0 rgba(255, 255, 255, 0.9),
    0 24px 48px -16px rgba(255, 61, 119, 0.3),
    0 0 0 1px rgba(255, 61, 119, 0.14);
}
.product-card:focus-visible {
  outline: 3px solid var(--color-border-focus);
  outline-offset: 3px;
}
.product-card:active {
  transform: translateY(-3px);
}

.product-card__media {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  background: var(--gradient-brand-soft);
  overflow: hidden;
}

.product-card__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.6s var(--ease-out-expo);
}
.product-card:hover .product-card__img {
  transform: scale(1.08);
}

/* 图片底部静息渐隐，与卡身融合 */
.product-card__media-fade {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 42%;
  background: linear-gradient(180deg, transparent 0%, rgba(255, 250, 245, 0.85) 100%);
  pointer-events: none;
  transition: opacity var(--transition);
}
.product-card:hover .product-card__media-fade {
  opacity: 0;
}

/* 悬浮深色遮罩 + 玻璃查看按钮 */
.product-card__media-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: var(--space-4);
  background: linear-gradient(180deg, rgba(42, 16, 48, 0) 35%, rgba(42, 16, 48, 0.62) 100%);
  opacity: 0;
  transition: opacity var(--transition);
  pointer-events: none;
}
.product-card:hover .product-card__media-overlay,
.product-card:focus-visible .product-card__media-overlay {
  opacity: 1;
}

.product-card__view-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-2) var(--space-5);
  border-radius: var(--radius-pill);
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  color: var(--color-primary);
  font-size: var(--text-sm);
  font-weight: 800;
  box-shadow: 0 8px 22px -6px rgba(214, 40, 110, 0.5);
  transform: translateY(10px);
  transition:
    transform var(--transition),
    background var(--transition-fast);
}
.product-card__view-btn svg {
  width: 15px;
  height: 15px;
  transition: transform var(--transition-fast);
}
.product-card:hover .product-card__view-btn {
  transform: translateY(0);
}
.product-card__view-btn:hover {
  background: #fff;
}
.product-card__view-btn:hover svg {
  transform: translateX(3px);
}

/* 无图占位：柔和品牌渐变 + 几何 SVG 购物袋 */
.product-card__img--placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  background: var(--gradient-brand-soft);
  object-fit: cover;
}
.product-card__placeholder-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  color: var(--color-primary);
  box-shadow: 0 8px 20px -8px rgba(255, 61, 119, 0.4);
}
.product-card__placeholder-badge svg {
  width: 26px;
  height: 26px;
}
.product-card__placeholder-text {
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--color-text-tertiary);
  letter-spacing: 0.06em;
}

.product-card__body {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-4) var(--space-4) var(--space-5);
}

.product-card__name {
  margin: 0;
  font-size: var(--text-base);
  font-weight: 600;
  line-height: var(--leading-tight);
  color: var(--color-text);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: calc(2em * var(--leading-tight));
  transition: color var(--transition-fast);
}
.product-card:hover .product-card__name {
  color: var(--color-primary);
}

.product-card__price {
  display: flex;
  align-items: baseline;
  gap: var(--space-2);
  margin-top: auto;
  font-size: var(--text-lg);
  color: var(--color-price);
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}
.product-card__price-value {
  color: inherit;
  font-weight: 800;
}
/* ¥ 符号：下沉缩小，更精致 */
.product-card__price-value :deep(.price-text::first-letter) {
  font-size: 0.7em;
  vertical-align: 0.18em;
  margin-right: 1px;
  opacity: 0.85;
}
.product-card__price-original {
  font-size: var(--text-xs);
  font-weight: 500;
  color: var(--color-text-muted);
}
.product-card__price-original :deep(.price-text) {
  color: inherit;
  font-weight: 500;
  text-decoration: line-through;
  text-decoration-color: var(--color-text-muted);
}
</style>
