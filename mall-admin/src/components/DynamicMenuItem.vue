<script setup lang="ts">
import type { AdminMenu } from '@/types/auth'

defineOptions({ name: 'DynamicMenuItem' })
defineProps<{ item: AdminMenu }>()
</script>

<template>
  <el-sub-menu v-if="item.type === 'DIRECTORY'" :index="`directory-${item.id}`">
    <template #title><span>{{ item.name }}</span></template>
    <DynamicMenuItem v-for="child in item.children" :key="child.id" :item="child" />
  </el-sub-menu>
  <el-menu-item v-else-if="item.type !== 'ACTION'" :index="item.path">
    <template #title>{{ item.name }}</template>
  </el-menu-item>
</template>
