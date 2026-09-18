<template>
  <span
    class="stock-badge"
    :class="statusClass"
  >
    <span class="stock-badge__dot" />
    <span>{{ label }}</span>
    <button
      v-if="status === 'UNKNOWN'"
      type="button"
      class="stock-badge__retry"
      @click="$emit('retry')"
    >
      重试
    </button>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { StockStatus } from '@/api/catalog'

const props = defineProps<{
  status: StockStatus
}>()

defineEmits<{
  retry: []
}>()

const label = computed(() => {
  switch (props.status) {
    case 'IN_STOCK': return '现货'
    case 'LOW_STOCK': return '库存紧张'
    case 'OUT_OF_STOCK': return '缺货'
    default: return '状态获取失败'
  }
})

const statusClass = computed(() => props.status.toLowerCase())
</script>

<style scoped>
.stock-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-pill);
  font-size: var(--text-xs);
  font-weight: 500;
  line-height: 1;
}
.stock-badge__dot {
  width: 6px;
  height: 6px;
  border-radius: var(--radius-pill);
  background: currentColor;
  flex-shrink: 0;
}
.stock-badge.in_stock {
  background: var(--color-success-bg);
  color: var(--color-success);
}
.stock-badge.low_stock {
  background: var(--color-warning-bg);
  color: var(--color-warning);
}
.stock-badge.out_of_stock {
  background: var(--color-danger-bg);
  color: var(--color-danger);
}
.stock-badge.unknown {
  background: var(--color-info-bg);
  color: var(--color-info);
}
.stock-badge__retry {
  border: none;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font-size: var(--text-xs);
  padding: 0;
  text-decoration: underline;
  text-underline-offset: 2px;
}
.stock-badge__retry:hover {
  opacity: 0.7;
}
</style>
