<script setup lang="ts">
/**
 * 通用状态视图：loading / empty / error 三态插槽，供首页/列表/详情复用。
 *
 * - loading=true → 渲染 #loading 插槽（默认骨架屏）
 * - error 非空 → 渲染 #error 插槽（默认错误文案 + 重试按钮）
 * - 空数据（isEmpty=true）→ 渲染 #empty 插槽
 * - 否则渲染默认插槽（success 内容）
 */
const props = defineProps<{
  loading?: boolean
  error?: string
  isEmpty?: boolean
}>()

const emit = defineEmits<{ retry: [] }>()
</script>

<template>
  <div class="state-view">
    <slot
      v-if="props.loading"
      name="loading"
    >
      <div
        class="state-view__skeleton"
        data-testid="state-loading"
        aria-busy="true"
        aria-live="polite"
      >
        <div class="state-view__skeleton-line state-view__skeleton-line--title" />
        <div class="state-view__skeleton-line state-view__skeleton-line--text" />
        <div class="state-view__skeleton-line state-view__skeleton-line--text" />
        <div class="state-view__skeleton-line state-view__skeleton-line--short" />
      </div>
    </slot>
    <slot
      v-else-if="props.error"
      name="error"
      :error="props.error"
      :retry="() => emit('retry')"
    >
      <div
        class="state-view__placeholder state-view__error"
        data-testid="state-error"
        role="alert"
      >
        <p class="state-view__error-text">{{ props.error }}</p>
        <button
          type="button"
          class="state-view__retry"
          data-testid="state-retry"
          @click="emit('retry')"
        >
          重试
        </button>
      </div>
    </slot>
    <slot
      v-else-if="props.isEmpty"
      name="empty"
    >
      <div
        class="state-view__placeholder"
        data-testid="state-empty"
      >
        暂无数据
      </div>
    </slot>
    <slot v-else />
  </div>
</template>

<style scoped>
.state-view {
  width: 100%;
}

.state-view__placeholder {
  padding: var(--space-12) var(--space-4);
  text-align: center;
  color: var(--color-text-tertiary);
  font-size: var(--text-base);
}

.state-view__error {
  color: var(--color-text-secondary);
}

.state-view__error-text {
  margin: 0 0 var(--space-3);
  color: var(--color-danger);
  font-size: var(--text-base);
}

.state-view__retry {
  padding: var(--space-2) var(--space-5);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
  background: var(--color-bg);
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
}
.state-view__retry:hover {
  border-color: var(--color-border-focus);
  color: var(--color-text);
}
.state-view__retry:focus-visible {
  outline: 2px solid var(--color-border-focus);
  outline-offset: 2px;
}

/* 骨架屏：仅在内容区显示，避免卡片堆砌感 */
.state-view__skeleton {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-4) 0;
  max-width: 480px;
}
.state-view__skeleton-line {
  height: 14px;
  border-radius: var(--radius-sm);
  background: linear-gradient(
    90deg,
    var(--color-bg-muted) 0%,
    var(--color-border) 50%,
    var(--color-bg-muted) 100%
  );
  background-size: 200% 100%;
  animation: state-view-shimmer 1.4s ease-in-out infinite;
}
.state-view__skeleton-line--title {
  width: 40%;
  height: 20px;
}
.state-view__skeleton-line--text {
  width: 100%;
}
.state-view__skeleton-line--short {
  width: 60%;
}

@keyframes state-view-shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .state-view__skeleton-line {
    animation: none;
    background: var(--color-bg-muted);
  }
}
</style>
