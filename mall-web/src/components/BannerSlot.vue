<script setup lang="ts">
import type { Banner } from '@/api/catalog'

/**
 * Banner 占位组件：banners=[] 时渲染内置静态占位内容；
 * 后端返回 banners 时渲染图片链接。
 */
const props = defineProps<{
  banners: Banner[]
}>()
</script>

<template>
  <div class="banner-slot" data-testid="banner-slot">
    <template v-if="props.banners.length > 0">
      <a v-for="b in props.banners" :key="b.id" :href="b.linkUrl" class="banner-slot__item">
        <img :src="b.imageUrl" alt="banner" loading="lazy" />
      </a>
    </template>
    <div v-else class="banner-slot__placeholder">
      <span>精选好物 · 品质保障</span>
    </div>
  </div>
</template>

<style scoped>
.banner-slot {
  margin-bottom: 16px;
}

.banner-slot__item {
  display: block;
  margin-bottom: 8px;
}

.banner-slot__item img {
  width: 100%;
  border-radius: 8px;
}

.banner-slot__placeholder {
  padding: 24px;
  text-align: center;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  border-radius: 8px;
  font-size: 16px;
}
</style>
