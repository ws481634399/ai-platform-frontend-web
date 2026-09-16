<template>
  <span
    class="stock-badge"
    :class="statusClass"
  >
    <span>{{ label }}</span>
    <button
      v-if="status === 'UNKNOWN'"
      type="button"
      class="retry-btn"
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
  gap: 6px;
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 12px;
}
.stock-badge.in_stock { background: #e8f5e9; color: #2e7d32; }
.stock-badge.low_stock { background: #fff3e0; color: #ef6c00; }
.stock-badge.out_of_stock { background: #ffebee; color: #c62828; }
.stock-badge.unknown { background: #f5f5f5; color: #757575; }
.retry-btn {
  border: none;
  background: transparent;
  color: #409eff;
  cursor: pointer;
  font-size: 12px;
  padding: 0;
}
</style>
