<script setup lang="ts">
import type { Banner } from '@/api/catalog'

/**
 * Banner 占位组件：banners=[] 时渲染内置静态占位内容；
 * 后端返回 banners 时渲染图片链接。
 *
 * 设计原则：禁止紫蓝渐变占位（UI.md 反 AI-generated 风格）。
 * 占位使用克制纯色 + 精炼文案 + 商品图导向布局。
 */
const props = defineProps<{
  banners: Banner[]
}>()
</script>

<template>
  <div
    class="banner-slot"
    data-testid="banner-slot"
  >
    <template v-if="props.banners.length > 0">
      <a
        v-for="b in props.banners"
        :key="b.id"
        :href="b.linkUrl"
        class="banner-slot__item"
      >
        <img
          :src="b.imageUrl"
          alt="banner"
          loading="lazy"
        >
      </a>
    </template>
    <div
      v-else
      class="banner-slot__placeholder"
    >
      <div class="banner-slot__placeholder-inner">
        <p class="banner-slot__placeholder-eyebrow">AI Mall · 智能电商</p>
        <h2 class="banner-slot__placeholder-title">精选好物 · 品质保障</h2>
        <p class="banner-slot__placeholder-text">从浏览到下单，每一步都为你优化</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.banner-slot {
  margin-bottom: var(--space-8);
}

.banner-slot__item {
  display: block;
  margin-bottom: var(--space-2);
}
.banner-slot__item:last-child {
  margin-bottom: 0;
}
.banner-slot__item img {
  width: 100%;
  display: block;
  border-radius: var(--radius-lg);
}

/* 占位区：克制纯色（无紫蓝渐变），网格背景做轻微纹理 */
.banner-slot__placeholder {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 220px;
  padding: var(--space-10) var(--space-6);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}
.banner-slot__placeholder::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(circle at 1px 1px, var(--color-border) 1px, transparent 0);
  background-size: 24px 24px;
  opacity: 0.6;
  pointer-events: none;
}

.banner-slot__placeholder-inner {
  position: relative;
  text-align: center;
}
.banner-slot__placeholder-eyebrow {
  margin: 0 0 var(--space-2);
  color: var(--color-text-tertiary);
  font-size: var(--text-xs);
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
.banner-slot__placeholder-title {
  margin: 0 0 var(--space-2);
  color: var(--color-text);
  font-size: var(--text-3xl);
  font-weight: 700;
  letter-spacing: var(--tracking-tight);
  line-height: var(--leading-tight);
}
.banner-slot__placeholder-text {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--text-base);
}

@media (max-width: 640px) {
  .banner-slot__placeholder {
    min-height: 180px;
    padding: var(--space-8) var(--space-4);
  }
  .banner-slot__placeholder-title {
    font-size: var(--text-2xl);
  }
}
</style>
