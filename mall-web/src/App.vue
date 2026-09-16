<script setup lang="ts">
import { onMounted } from 'vue'
import { useCartStore } from '@/stores/cart'

const cart = useCartStore()

// 应用启动后初始化购物车：若已登录且游客车非空则触发合并
onMounted(() => {
  cart.init()
})
</script>

<template>
  <router-view />
</template>
