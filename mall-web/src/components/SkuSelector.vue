<template>
  <div class="sku-selector">
    <div v-for="dim in dimensions" :key="dim.name" class="dim-row">
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
 * - 该值所在组合的 SKU 状态为 DISABLED（后端 status），置灰不可点
 * - 未选齐时，根据已选其他维度+该值拼出可能组合，若全部命中的组合均为 DISABLED 则禁用
 */
function isValueDisabled(dimName: string, value: string): boolean {
  // 假设已选该值，与其他已选维度拼组合键
  const parts: string[] = []
  let missingOther = false
  for (const name of props.dimensionsOrder) {
    if (name === dimName) {
      parts.push(value)
    } else if (selected.has(name)) {
      parts.push(selected.get(name)!)
    } else {
      missingOther = true
      parts.push('*')
    }
  }
  if (missingOther) {
    // 存在未选维度：枚举该维度所有未选值的组合，若全部命中且全 DISABLED 才禁用
    const unselected = props.dimensionsOrder.filter(
      (n) => n !== dimName && !selected.has(n),
    )
    // 取第一个未选维度做枚举（简化：只检查未选维度是否存在任意组合非 DISABLED）
    const firstUnselected = unselected[0]
    if (!firstUnselected) return false
    const dim = props.dimensions.find((d) => d.name === firstUnselected)
    if (!dim) return false
    let hasEnabled = false
    for (const v of dim.values) {
      const trial = parts.map((p, i) => (props.dimensionsOrder[i] === firstUnselected ? v : p))
      const key = trial.join('|')
      const entry = props.skuIndex[key]
      if (entry && entry.status !== 'DISABLED') {
        hasEnabled = true
        break
      }
    }
    return !hasEnabled
  }
  // 已选齐：直接看该组合的 SKU 状态
  const entry = props.skuIndex[parts.join('|')]
  return !entry || entry.status === 'DISABLED'
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
