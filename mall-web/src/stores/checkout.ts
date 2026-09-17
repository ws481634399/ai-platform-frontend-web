import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { OrderItemRequest, OrderSource } from '@/types/order'

/**
 * 结算入口 Store（CHG-0019）。
 *
 * BUY_NOW（商品详情「立即购买」）通过本 store 把行项目带到结算页；
 * CART 结算无需载荷（服务端按会员购物车勾选行实时读取）。
 * 载荷为一次性：下单成功或离开结算页后清除。
 */
export const useCheckoutStore = defineStore('checkout', () => {
  const source = ref<OrderSource | null>(null)
  const buyNowItems = ref<OrderItemRequest[]>([])

  function startCartCheckout(): void {
    source.value = 'CART'
    buyNowItems.value = []
  }

  function startBuyNow(item: OrderItemRequest): void {
    source.value = 'BUY_NOW'
    buyNowItems.value = [{ skuId: item.skuId, quantity: item.quantity }]
  }

  function clear(): void {
    source.value = null
    buyNowItems.value = []
  }

  return { source, buyNowItems, startCartCheckout, startBuyNow, clear }
})
