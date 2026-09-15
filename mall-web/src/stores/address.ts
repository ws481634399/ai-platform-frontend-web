import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { addressApi } from '@/api/address'
import type { AddressUpsertRequest, ShippingAddressView } from '@/types/address'

/**
 * 收货地址 Store（CHG-0016 STORY-003-01-03-01 / DU-FE-603）。
 *
 * 列表顺序始终信任后端（is_default DESC, updated_at DESC），本地不重排；
 * setDefault 做乐观更新（即时置顶），失败回滚快照并强制重拉后再抛出，由视图提示。
 * 写操作成功后统一重拉，避免本地维护与后端排序/默认标记不一致。
 */
export const useAddressStore = defineStore('member-address', () => {
  const items = ref<ShippingAddressView[]>([])
  const defaultId = ref<string | null>(null)
  const loading = ref(false)
  const loaded = ref(false)

  const hasDefault = computed(() => items.value.some((a) => a.isDefault))
  const reachLimit = computed(() => items.value.length >= 20)

  async function fetchList(force = false) {
    if (loaded.value && !force) return
    loading.value = true
    try {
      const result = await addressApi.list()
      items.value = result.items
      defaultId.value = result.defaultId
      loaded.value = true
    } finally {
      loading.value = false
    }
  }

  /** 新增成功后重拉（首条默认/排序由后端决定）。 */
  async function addAddress(request: AddressUpsertRequest): Promise<ShippingAddressView> {
    const created = await addressApi.create(request)
    await fetchList(true)
    return created
  }

  async function updateAddress(id: string, request: AddressUpsertRequest): Promise<ShippingAddressView> {
    const updated = await addressApi.update(id, request)
    await fetchList(true)
    return updated
  }

  async function removeAddress(id: string): Promise<void> {
    await addressApi.remove(id)
    await fetchList(true)
  }

  /** 乐观置默认：本地即时改标+置顶；失败回滚快照并重拉，再把错误抛给视图。 */
  async function setDefault(id: string): Promise<void> {
    const snapshot = { items: [...items.value], defaultId: defaultId.value }
    const target = items.value.find((a) => a.id === id)
    if (!target) {
      await fetchList(true)
      return
    }
    items.value = items.value
      .map((a) => ({ ...a, isDefault: a.id === id }))
      .sort((a, b) => Number(b.isDefault) - Number(a.isDefault))
    defaultId.value = id
    try {
      await addressApi.setDefault(id)
      await fetchList(true)
    } catch (error) {
      items.value = snapshot.items
      defaultId.value = snapshot.defaultId
      await fetchList(true).catch(() => undefined)
      throw error
    }
  }

  /** 退出登录/切换账号时清空（由 member store clear 联动或视图卸载时调用）。 */
  function reset() {
    items.value = []
    defaultId.value = null
    loaded.value = false
    loading.value = false
  }

  return {
    items,
    defaultId,
    loading,
    loaded,
    hasDefault,
    reachLimit,
    fetchList,
    addAddress,
    updateAddress,
    removeAddress,
    setDefault,
    reset,
  }
})
