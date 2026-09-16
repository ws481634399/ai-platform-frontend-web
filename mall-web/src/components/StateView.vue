<script setup lang="ts">
/**
 * 通用状态视图：loading / empty / error 三态插槽，供首页/列表/详情复用。
 *
 * - loading=true → 渲染 #loading 插槽（默认「加载中…」）
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
        class="state-view__placeholder"
        data-testid="state-loading"
      >
        加载中…
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
      >
        <p>{{ props.error }}</p>
        <button
          type="button"
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
.state-view__placeholder {
  padding: 32px 16px;
  text-align: center;
  color: #6b7280;
}

.state-view__error {
  color: #dc2626;
}

.state-view__error button {
  margin-top: 8px;
  padding: 6px 16px;
  cursor: pointer;
}
</style>
