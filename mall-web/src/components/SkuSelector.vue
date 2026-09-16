<template>
  <div class="sku-selector">
    <div
      v-for="dim in dimensions"
      :key="dim.name"
      class="dim-row"
    >
      <span class="dim-label">{{ dim.name }}</span>
      <div class="dim-values">
        <button
          v-for="value in dim.values"
          :key="value"
          type="button"
          class="dim-value"
          :class="{
            active: selected.get(dim.name) === value,
            disabled: isValueDisabled(dim.name, value),
          }"
          :disabled="isValueDisabled(dim.name, value)"
          @click="select(dim.name, value)"
        >
          {{ value }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive } from 'vue'
import type { SpecDimension, SkuIndexEntry } from '@/api/catalog'

const props = defineProps<{
  dimensions: SpecDimension[]
  skuIndex: Record<string, SkuIndexEntry>
  dimensionsOrder: string[]
}>()

const emit = defineEmits<{
  change: [sku: SkuIndexEntry | null]
}>()

/** 已选维度值 Map（维度名 → 值） */
const selected = reactive<Map<string, string>>(new Map())

/** 组合键 = 按 dimensionsOrder 拼接已选值 */
const comboKey = computed(() => {
  const parts: string[] = []
  for (const name of props.dimensionsOrder) {
    const v = selected.get(name)
    if (!v) return null
    parts.push(v)
  }
  return parts.join('|')
})

/** 当前命中的 SKU */
const currentSku = computed<SkuIndexEntry | null>(() => {
  const key = comboKey.value
  if (!key) return null
  return props.skuIndex[key] ?? null
})

/**
 * 判断某维度值是否禁用：
 * 遍历 skuIndex 全部组合，若存在「包含该值 + 兼容其他已选维度」的非 DISABLED 组合则可选；
 * 未选维度作为通配（不参与约束）。支持任意维度数。
 */
function isValueDisabled(dimName: string, value: string): boolean {
  const dimIndex = props.dimensionsOrder.indexOf(dimName)
  for (const [key, entry] of Object.entries(props.skuIndex)) {
    if (entry.status === 'DISABLED') continue
    const parts = key.split('|')
    if (parts[dimIndex] !== value) continue
    let compatible = true
    for (let i = 0; i < props.dimensionsOrder.length; i++) {
      if (i === dimIndex) continue
      const chosen = selected.get(props.dimensionsOrder[i])
      if (chosen && parts[i] !== chosen) {
        compatible = false
        break
      }
    }
    if (compatible) return false
  }
  return true
}

function select(dimName: string, value: string) {
  if (isValueDisabled(dimName, value)) return
  if (selected.get(dimName) === value) {
    selected.delete(dimName)
  } else {
    selected.set(dimName, value)
  }
  emit('change', currentSku.value)
}

defineExpose({ selected, currentSku })
</script>

<style scoped>
.sku-selector {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.dim-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}
.dim-label {
  min-width: 56px;
  color: #666;
  font-size: 14px;
  padding-top: 6px;
}
.dim-values {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.dim-value {
  padding: 6px 14px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.15s;
}
.dim-value:hover:not(:disabled) {
  border-color: #409eff;
  color: #409eff;
}
.dim-value.active {
  border-color: #409eff;
  background: #409eff;
  color: #fff;
}
.dim-value.disabled {
  background: #f5f5f5;
  color: #ccc;
  cursor: not-allowed;
  text-decoration: line-through;
}
</style>
