<template>
  <div class="section-heading">
    <div>
      <strong>{{ title }}</strong>
      <p>{{ hint }}</p>
    </div>
    <slot />
  </div>
</template>

<script setup lang="ts">
defineProps<{ title: string; hint: string }>()
</script>

<style scoped>
.section-heading { display: flex; align-items: center; justify-content: space-between; gap: 24px; }
strong { color: var(--el-text-color-primary); font-size: 16px; }
p { margin: 5px 0 0; color: var(--el-text-color-secondary); font-size: 13px; }
</style>
