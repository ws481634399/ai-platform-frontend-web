import { computed, ref } from 'vue'

/**
 * 游客购物车（LocalStorage 持久化）。
 *
 * CHG-0018 DU-FE-801：游客在未登录时加购写入 LocalStorage，登录后由 cart store
 * 编排合并到会员车。
 *
 * 约定：
 * - key: mall-web:guest-cart
 * - 条目：{ skuId, quantity, selected, addedAt }
 * - 上限：单 SKU 数量 ≤ 999（超出提示）；总条目数 ≤ 100（超出拒绝并提示）
 * - 惰性清理：超过 90 天的条目在 load 时丢弃
 */

const STORAGE_KEY = 'mall-web:guest-cart'
const MAX_QUANTITY = 999
const MAX_ITEMS = 100
const TTL_MS = 90 * 24 * 60 * 60 * 1000

export interface GuestCartItem {
  skuId: string
  quantity: number
  selected: boolean
  addedAt: number
}

/** 加购结果 */
export interface GuestCartResult {
  success: boolean
  message?: string
}

function loadRaw(): GuestCartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as GuestCartItem[]
    if (!Array.isArray(parsed)) return []
    // 惰性清理：丢弃超过 90 天的条目
    const now = Date.now()
    const fresh = parsed.filter((it) => now - it.addedAt <= TTL_MS)
    if (fresh.length !== parsed.length) persist(fresh)
    return fresh
  } catch {
    return []
  }
}

function persist(items: GuestCartItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    /* LocalStorage 不可用时静默降级 */
  }
}

export function useGuestCart() {
  const items = ref<GuestCartItem[]>(loadRaw())

  const totalQuantity = computed(() =>
    items.value.reduce((sum, it) => sum + it.quantity, 0),
  )

  const selectedQuantity = computed(() =>
    items.value.filter((it) => it.selected).reduce((sum, it) => sum + it.quantity, 0),
  )

  const itemCount = computed(() => items.value.length)

  /** 加购：存在则累加，不存在则新增（受上限约束） */
  function add(skuId: string, quantity = 1): GuestCartResult {
    if (quantity <= 0) return { success: false, message: '数量必须大于 0' }
    const idx = items.value.findIndex((it) => it.skuId === skuId)
    if (idx >= 0) {
      const next = items.value[idx].quantity + quantity
      if (next > MAX_QUANTITY) {
        return { success: false, message: `单个 SKU 最多 ${MAX_QUANTITY} 件` }
      }
      items.value[idx].quantity = next
    } else {
      if (items.value.length >= MAX_ITEMS) {
        return { success: false, message: `购物车最多 ${MAX_ITEMS} 种商品` }
      }
      if (quantity > MAX_QUANTITY) {
        return { success: false, message: `单个 SKU 最多 ${MAX_QUANTITY} 件` }
      }
      items.value.push({ skuId, quantity, selected: true, addedAt: Date.now() })
    }
    persist(items.value)
    return { success: true }
  }

  /** 修改数量（步进器） */
  function updateQuantity(skuId: string, quantity: number): GuestCartResult {
    if (quantity <= 0) return { success: false, message: '数量必须大于 0' }
    if (quantity > MAX_QUANTITY) {
      return { success: false, message: `单个 SKU 最多 ${MAX_QUANTITY} 件` }
    }
    const it = items.value.find((i) => i.skuId === skuId)
    if (!it) return { success: false, message: '商品不在购物车' }
    it.quantity = quantity
    persist(items.value)
    return { success: true }
  }

  /** 切换选中 */
  function setSelected(skuId: string, selected: boolean): void {
    const it = items.value.find((i) => i.skuId === skuId)
    if (it) {
      it.selected = selected
      persist(items.value)
    }
  }

  /** 全选 / 取消全选 */
  function setAllSelected(selected: boolean): void {
    for (const it of items.value) it.selected = selected
    persist(items.value)
  }

  /** 移除条目 */
  function remove(skuId: string): void {
    items.value = items.value.filter((it) => it.skuId !== skuId)
    persist(items.value)
  }

  /** 清空（合并成功后调用） */
  function clear(): void {
    items.value = []
    persist(items.value)
  }

  /** 重新从 LocalStorage 加载（用于同步多标签页等场景） */
  function reload(): void {
    items.value = loadRaw()
  }

  return {
    items,
    totalQuantity,
    selectedQuantity,
    itemCount,
    add,
    updateQuantity,
    setSelected,
    setAllSelected,
    remove,
    clear,
    reload,
    MAX_ITEMS,
    MAX_QUANTITY,
  }
}
