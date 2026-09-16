import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { cartApi, type CartView, type MergeCartResponse } from '@/api/cart'
import { useMemberStore } from '@/stores/member'
import { useGuestCart } from '@/composables/useGuestCart'

/** 从错误中提取业务 message 与 HTTP status（兼容 axios 错误与普通对象） */
function parseError(e: unknown, fallback: string): { message: string; status?: number } {
  if (typeof e === 'object' && e !== null) {
    const obj = e as { response?: { data?: { message?: string }; status?: number }; message?: string }
    const msg = obj.response?.data?.message ?? obj.message
    return { message: msg ?? fallback, status: obj.response?.status }
  }
  return { message: fallback }
}

/**
 * 购物车 Store（CHG-0018 DU-FE-801）。
 *
 * 双模：
 * - 游客：读写本地 LocalStorage（useGuestCart）
 * - 会员：调用后端 API，GET /api/mall/cart 为读模型
 *
 * 登录合并编排：
 * 1. 检测到登录态切换为已登录 + 游客车非空 + 未完成合并
 * 2. issueMergeToken → merge
 * 3. 成功（200）：清空游客车，展示 truncated/dropped 汇总
 * 4. token 失效（400/401）：重取 token 重试一次
 * 5. 网络失败：保留游客车 + 置 mergePending，下次进购物车重试
 */
export const useCartStore = defineStore('cart', () => {
  const member = useMemberStore()
  const guest = useGuestCart()

  // ── 会员车状态 ──────────────────────────────────────────
  const memberCart = ref<CartView | null>(null)
  const loading = ref(false)
  const error = ref('')

  // ── 合并状态 ────────────────────────────────────────────
  const mergePending = ref(false)
  const mergeMessage = ref('')
  let mergedThisSession = false

  const isGuest = computed(() => !member.isAuthenticated)

  /** 购物车条目数（用于头部角标） */
  const badgeCount = computed(() => {
    if (isGuest.value) return guest.itemCount.value
    return memberCart.value?.items.length ?? 0
  })

  // ── 会员车操作 ──────────────────────────────────────────
  async function loadMemberCart() {
    loading.value = true
    error.value = ''
    try {
      memberCart.value = await cartApi.getCart()
    } catch (e) {
      error.value = parseError(e, '购物车加载失败').message
      memberCart.value = null
    } finally {
      loading.value = false
    }
  }

  async function addItem(skuId: string, quantity: number) {
    if (isGuest.value) {
      return guest.add(skuId, quantity)
    }
    try {
      memberCart.value = await cartApi.addItem({ skuId, quantity })
      return { success: true }
    } catch (e) {
      return { success: false, message: parseError(e, '加购失败').message }
    }
  }

  async function updateItem(skuId: string, quantity: number) {
    if (isGuest.value) return guest.updateQuantity(skuId, quantity)
    try {
      memberCart.value = await cartApi.updateItem({ skuId, quantity })
      return { success: true }
    } catch (e) {
      return { success: false, message: parseError(e, '修改失败').message }
    }
  }

  async function removeItems(skuIds: string[]) {
    if (isGuest.value) {
      for (const id of skuIds) guest.remove(id)
      return { success: true }
    }
    try {
      memberCart.value = await cartApi.removeItems({ skuIds })
      return { success: true }
    } catch (e) {
      return { success: false, message: parseError(e, '删除失败').message }
    }
  }

  async function setSelected(skuId: string, selected: boolean) {
    if (isGuest.value) {
      guest.setSelected(skuId, selected)
      return { success: true }
    }
    try {
      memberCart.value = await cartApi.setSelected({ skuId, selected })
      return { success: true }
    } catch (e) {
      return { success: false, message: parseError(e, '操作失败').message }
    }
  }

  async function selectAll(selected: boolean) {
    if (isGuest.value) {
      guest.setAllSelected(selected)
      return { success: true }
    }
    try {
      memberCart.value = await cartApi.selectAll({ selected })
      return { success: true }
    } catch (e) {
      return { success: false, message: parseError(e, '操作失败').message }
    }
  }

  // ── 合并编排 ────────────────────────────────────────────
  /** 执行合并：issueToken → merge（token 失效时重取一次） */
  async function performMerge(): Promise<void> {
    if (guest.itemCount.value === 0) return
    mergePending.value = true
    mergeMessage.value = ''
    try {
      const { mergeToken } = await cartApi.issueMergeToken()
      const items = guest.items.value.map((it) => ({ skuId: it.skuId, quantity: it.quantity }))
      try {
        const result: MergeCartResponse = await cartApi.merge({ mergeToken, items })
        handleMergeResult(result)
        guest.clear()
        mergedThisSession = true
      } catch (e) {
        const { status } = parseError(e, '')
        // token 失效（400 TOKEN_MISSING / 401 TOKEN_MISMATCH）→ 重取一次
        if (status === 400 || status === 401) {
          const retry = await cartApi.issueMergeToken()
          const result = await cartApi.merge({ mergeToken: retry.mergeToken, items })
          handleMergeResult(result)
          guest.clear()
          mergedThisSession = true
        } else {
          // 网络失败：保留游客车，标记 pending 以便重试
          mergeMessage.value = '合并失败，请稍后重试'
        }
      }
    } catch {
      mergeMessage.value = '合并失败，请稍后重试'
    } finally {
      mergePending.value = false
    }
  }

  function handleMergeResult(result: MergeCartResponse) {
    const parts: string[] = []
    if (result.truncated?.length) {
      parts.push(`${result.truncated.length} 种商品因超出上限被截断`)
    }
    if (result.dropped?.length) {
      parts.push(`${result.dropped.length} 种商品因不可售被移除`)
    }
    if (parts.length) {
      mergeMessage.value = `合并完成：${parts.join('，')}`
    }
  }

  /** 重试合并（进购物车页面时若 pending 则触发） */
  async function retryMerge() {
    if (mergePending.value && guest.itemCount.value > 0) {
      await performMerge()
    }
  }

  // ── 登录态监听：自动触发合并 ────────────────────────────
  watch(
    () => member.isAuthenticated,
    (authed) => {
      if (authed && guest.itemCount.value > 0 && !mergedThisSession) {
        performMerge()
        // 合并后刷新会员车
        loadMemberCart()
      }
    },
  )

  /** 应用初始化时若已登录且游客车非空，触发合并 */
  async function init() {
    if (member.isAuthenticated && guest.itemCount.value > 0 && !mergedThisSession) {
      await performMerge()
    }
    if (member.isAuthenticated) {
      await loadMemberCart()
    }
  }

  return {
    // 状态
    memberCart,
    loading,
    error,
    mergePending,
    mergeMessage,
    isGuest,
    badgeCount,
    guest,
    // 会员车
    loadMemberCart,
    addItem,
    updateItem,
    removeItems,
    setSelected,
    selectAll,
    // 合并
    performMerge,
    retryMerge,
    init,
  }
})
