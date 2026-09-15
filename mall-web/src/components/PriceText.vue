<script setup lang="ts">
/**
 * 金额展示组件：整数分 → ¥ 展示。
 *
 * 金额域模型保持 number（整数分），本组件仅展示层做单位换算，
 * 禁止 parseFloat 处理金额，直接用整数拆分元/分避免浮点误差。
 */
const props = defineProps<{
  /** 整数分 */
  value: number | null
}>()

/** 整数分格式化为 ¥X.XX（元/分整数拆分，无浮点） */
function formatFen(fen: number | null): string {
  if (fen == null) return '¥--'
  const sign = fen < 0 ? '-' : ''
  const abs = Math.abs(fen)
  const yuan = Math.floor(abs / 100)
  const cents = abs % 100
  return `${sign}¥${yuan}.${cents.toString().padStart(2, '0')}`
}
</script>

<template>
  <span class="price-text">{{ formatFen(props.value) }}</span>
</template>

<style scoped>
.price-text {
  color: #dc2626;
  font-weight: 600;
}
</style>
