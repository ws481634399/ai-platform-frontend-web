<script setup lang="ts">
import { onMounted } from 'vue'
import { useCartStore } from '@/stores/cart'
import { useMemberStore } from '@/stores/member'

const cart = useCartStore()
const member = useMemberStore()

// 应用启动后先尝试用 refresh cookie 恢复会话（/cart 等双模游客页不触发会员路由守卫），
// 再初始化购物车：若已登录且游客车非空则触发合并
onMounted(async () => {
  await member.restore()
  await cart.init()
})
</script>

<template>
  <router-view />
</template>
