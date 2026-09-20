<script setup lang="ts">
import { ref } from 'vue'
import type { Banner } from '@/api/catalog'

/**
 * Banner 位：后端返回 banners 时渲染运营图；为空时渲染内置电影感 Hero
 * （CHG-0023 UI 升级：潮流活力视觉，生成图 + 渐变遮罩 + 浮动玻璃徽标）。
 */

const props = defineProps<{
  banners: Banner[]
}>()

// Hero 生成图（landscape_16_9）；加载失败时回退到纯渐变底，保证不破图
const heroImageUrl =
  'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=' +
  encodeURIComponent(
    'Vibrant trendy e-commerce hero banner, glossy 3D floating shopping bags, gift boxes, sneakers, headphones, cosmetics and abstract glass spheres, coral orange, hot pink, magenta and violet gradient studio lighting, confetti sparkles, premium youthful shopping mall aesthetic, soft depth of field, rich saturated colors, open dark purple empty space on the left side for overlay text, objects only, absolutely no text, no words, no letters, no numbers, no brand names, no logo, no watermark, no signage, no typography anywhere',
  ) +
  '&image_size=landscape_16_9'
const heroImageFailed = ref(false)
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
    <section
      v-else
      class="hero"
      data-testid="banner-hero"
    >
      <img
        v-if="!heroImageFailed"
        :src="heroImageUrl"
        alt=""
        aria-hidden="true"
        class="hero__img"
        @error="heroImageFailed = true"
      >
      <div class="hero__scrim" />
      <div class="hero__content">
        <h2 class="hero__title">
          精选好物<span class="hero__title-dot">·</span>品质保障
        </h2>
        <p class="hero__text">
          从浏览到下单，每一步都为你优化
        </p>
        <div class="hero__actions">
          <router-link
            to="/products"
            class="hero__cta"
          >
            立即逛新品
            <svg
              viewBox="0 0 20 20"
              fill="none"
              aria-hidden="true"
              class="hero__cta-arrow"
            >
              <path
                d="M4 10h12m0 0l-5-5m5 5l-5 5"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </router-link>
          <router-link
            to="/products"
            class="hero__ghost"
          >
            全部商品
          </router-link>
        </div>
      </div>

      <!-- 浮动玻璃徽标 -->
      <div class="hero__chip hero__chip--a">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M12 2.5l1.9 6.2 6.1 1.8-6.1 1.9L12 18.7l-1.9-6.3L4 10.5l6.1-1.8L12 2.5z"
            fill="currentColor"
          />
        </svg>
        每日上新
      </div>
      <div class="hero__chip hero__chip--b">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M12 3l7 3v5.5c0 4.4-3 8.4-7 9.5-4-1.1-7-5.1-7-9.5V6l7-3z"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linejoin="round"
          />
          <path
            d="M9 12l2 2 4-4"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        品质保障
      </div>
    </section>
  </div>
</template>

<style scoped>
.banner-slot {
  margin-bottom: var(--space-10);
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
  border-radius: var(--radius-2xl);
}

/* ── Hero：电影感横幅 ─────────────────────── */
.hero {
  position: relative;
  min-height: 440px;
  border-radius: var(--radius-2xl);
  overflow: hidden;
  isolation: isolate;
  display: flex;
  align-items: center;
  padding: var(--space-12);
  /* 图片失败时的渐变兜底 */
  background: var(--gradient-dark);
  box-shadow: var(--shadow-lg);
}

.hero__img {
  position: absolute;
  inset: 0;
  z-index: -2;
  width: 100%;
  height: 100%;
  object-fit: cover;
  animation: hero-zoom 14s var(--ease-out-expo) both;
}

@keyframes hero-zoom {
  from {
    transform: scale(1.12);
  }
  to {
    transform: scale(1);
  }
}

.hero__scrim {
  position: absolute;
  inset: 0;
  z-index: -1;
  background:
    /* 压暗右下：消除生成图角落水印的视觉干扰，并给画面打底 */
    linear-gradient(0deg, rgba(32, 8, 40, 0.55) 0%, rgba(32, 8, 40, 0) 26%),
    radial-gradient(120% 90% at 100% 100%, rgba(32, 8, 40, 0.45) 0%, rgba(32, 8, 40, 0) 45%),
    var(--gradient-hero-scrim);
}

.hero__content {
  position: relative;
  max-width: 560px;
  color: #fff;
}

.hero__title {
  margin: 0 0 var(--space-4);
  font-family: var(--font-display);
  font-size: clamp(2.1rem, 4.6vw, 3.7rem);
  font-weight: 900;
  letter-spacing: var(--tracking-tight);
  line-height: 1.12;
  text-shadow: 0 4px 24px rgba(30, 0, 30, 0.45);
  animation: pop-in 0.7s var(--ease-spring) 0.05s both;
}
.hero__title-dot {
  margin: 0 var(--space-2);
  color: var(--color-coral);
}

.hero__text {
  margin: 0 0 var(--space-8);
  font-size: var(--text-lg);
  line-height: var(--leading-relaxed);
  color: rgba(255, 255, 255, 0.88);
  text-shadow: 0 2px 12px rgba(30, 0, 30, 0.4);
  animation: fade-up 0.7s var(--ease-out-expo) 0.16s both;
}

.hero__actions {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  flex-wrap: wrap;
  animation: fade-up 0.7s var(--ease-out-expo) 0.28s both;
}

.hero__cta {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  height: 50px;
  padding: 0 var(--space-8);
  border-radius: var(--radius-pill);
  background: var(--gradient-brand);
  background-size: 170% 170%;
  color: #fff;
  font-size: var(--text-md);
  font-weight: 800;
  box-shadow: var(--shadow-glow-brand);
  overflow: hidden;
  transition:
    transform var(--transition-fast),
    box-shadow var(--transition-fast);
}
.hero__cta::after {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  width: 38%;
  background: linear-gradient(115deg, transparent, rgba(255, 255, 255, 0.55), transparent);
  transform: translateX(-180%) skewX(-18deg);
  transition: transform 0.6s var(--ease-out-expo);
}
.hero__cta:hover {
  color: #fff;
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 18px 38px -10px rgba(255, 61, 119, 0.75);
}
.hero__cta:hover::after {
  transform: translateX(360%) skewX(-18deg);
}
.hero__cta-arrow {
  width: 18px;
  height: 18px;
  transition: transform var(--transition-fast);
}
.hero__cta:hover .hero__cta-arrow {
  transform: translateX(4px);
}

.hero__ghost {
  display: inline-flex;
  align-items: center;
  height: 50px;
  padding: 0 var(--space-8);
  border-radius: var(--radius-pill);
  border: 1.5px solid rgba(255, 255, 255, 0.55);
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  color: #fff;
  font-size: var(--text-md);
  font-weight: 700;
  transition:
    background var(--transition-fast),
    transform var(--transition-fast),
    border-color var(--transition-fast);
}
.hero__ghost:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.22);
  border-color: rgba(255, 255, 255, 0.85);
  transform: translateY(-3px);
}

/* 玻璃徽标 */
.hero__chip {
  position: absolute;
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-pill);
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.28);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  color: #fff;
  font-size: var(--text-sm);
  font-weight: 700;
  box-shadow: 0 10px 30px -10px rgba(40, 0, 50, 0.6);
  animation:
    pop-in 0.7s var(--ease-spring) 0.42s both,
    float-y 5.5s ease-in-out 1.2s infinite;
}
.hero__chip svg {
  width: 17px;
  height: 17px;
  color: #ffd66b;
}
.hero__chip--a {
  top: 14%;
  right: 12%;
}
.hero__chip--b {
  right: 22%;
  bottom: 16%;
  animation:
    pop-in 0.7s var(--ease-spring) 0.55s both,
    float-y 6.5s ease-in-out 1.6s infinite;
}
.hero__chip--b svg {
  color: #5cf2c8;
}

@media (max-width: 768px) {
  .hero {
    min-height: 380px;
    padding: var(--space-8) var(--space-6);
    align-items: flex-end;
  }
  .hero__scrim {
    background: linear-gradient(180deg, rgba(38, 12, 46, 0.2) 0%, rgba(38, 12, 46, 0.82) 72%);
  }
  .hero__content {
    max-width: 100%;
  }
  .hero__text {
    margin-bottom: var(--space-6);
  }
  .hero__chip {
    display: none;
  }
}

@media (max-width: 420px) {
  .hero__actions {
    gap: var(--space-3);
  }
  .hero__cta,
  .hero__ghost {
    height: 44px;
    padding: 0 var(--space-6);
  }
}
</style>
