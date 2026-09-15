import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { addressApi } from '@/api/address'
import { useAddressStore } from './address'
import type { ShippingAddressView } from '@/types/address'

vi.mock('@/api/address', () => ({
  addressApi: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    setDefault: vi.fn(),
    getDefault: vi.fn(),
  },
}))

function view(id: string, isDefault = false): ShippingAddressView {
  return {
    id,
    receiverName: `用户${id}`,
    receiverPhone: '13800138000',
    province: '浙江省',
    city: '杭州市',
    district: '西湖区',
    detailAddress: `地址 ${id}`,
    postalCode: null,
    isDefault,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  }
}

describe('收货地址 Store（STORY-003-01-03-01/TC-001~005、TC-009）', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
  })

  it('fetchList 缓存列表与 defaultId；loaded 后不重复拉取，force 强拉', async () => {
    const store = useAddressStore()
    vi.mocked(addressApi.list).mockResolvedValueOnce({
      items: [view('1', true), view('2')],
      defaultId: '1',
    })
    await store.fetchList()
    await store.fetchList()
    expect(addressApi.list).toHaveBeenCalledOnce()
    expect(store.items.map((a) => a.id)).toEqual(['1', '2'])
    expect(store.defaultId).toBe('1')
    expect(store.hasDefault).toBe(true)

    vi.mocked(addressApi.list).mockResolvedValueOnce({ items: [], defaultId: null })
    await store.fetchList(true)
    expect(addressApi.list).toHaveBeenCalledTimes(2)
  })

  it('addAddress/updateAddress/removeAddress 成功后强拉列表（顺序信任后端）', async () => {
    const store = useAddressStore()
    vi.mocked(addressApi.list).mockResolvedValueOnce({ items: [], defaultId: null })
    await store.fetchList()

    vi.mocked(addressApi.create).mockResolvedValueOnce(view('9'))
    vi.mocked(addressApi.list).mockResolvedValueOnce({
      items: [view('9', true)],
      defaultId: '9',
    })
    await store.addAddress({ receiverName: 'x' } as never)
    expect(addressApi.create).toHaveBeenCalledWith({ receiverName: 'x' })
    expect(store.items[0].id).toBe('9')

    vi.mocked(addressApi.update).mockResolvedValueOnce(view('9', true))
    vi.mocked(addressApi.list).mockResolvedValueOnce({
      items: [view('9', true)],
      defaultId: '9',
    })
    await store.updateAddress('9', { receiverName: 'y' } as never)
    expect(addressApi.update).toHaveBeenCalledWith('9', { receiverName: 'y' })

    vi.mocked(addressApi.remove).mockResolvedValueOnce(undefined)
    vi.mocked(addressApi.list).mockResolvedValueOnce({ items: [], defaultId: null })
    await store.removeAddress('9')
    expect(addressApi.remove).toHaveBeenCalledWith('9')
    expect(store.items).toEqual([])
  })

  it('addAddress 失败（409 上限）抛错且不触发重拉、不污染列表', async () => {
    const store = useAddressStore()
    vi.mocked(addressApi.list).mockResolvedValueOnce({
      items: Array.from({ length: 20 }, (_, i) => view(`${i}`)),
      defaultId: '0',
    })
    await store.fetchList()
    expect(store.reachLimit).toBe(true)

    vi.mocked(addressApi.create).mockRejectedValueOnce(new Error('最多保存20条收货地址'))
    await expect(store.addAddress({} as never)).rejects.toThrow('最多保存20条收货地址')
    expect(addressApi.list).toHaveBeenCalledTimes(1)
    expect(store.items).toHaveLength(20)
  })

  it('setDefault 乐观更新：请求发出前本地已置顶改标，成功后以服务端重拉为准', async () => {
    const store = useAddressStore()
    vi.mocked(addressApi.list).mockResolvedValueOnce({
      items: [view('1', true), view('2')],
      defaultId: '1',
    })
    await store.fetchList()

    vi.mocked(addressApi.setDefault).mockImplementationOnce(async () => {
      // 乐观更新在请求等待期间已生效
      expect(store.items.map((a) => a.id)).toEqual(['2', '1'])
      expect(store.items[0].isDefault).toBe(true)
      expect(store.items[1].isDefault).toBe(false)
      expect(store.defaultId).toBe('2')
      return view('2', true)
    })
    vi.mocked(addressApi.list).mockResolvedValueOnce({
      items: [view('2', true), view('1')],
      defaultId: '2',
    })
    await store.setDefault('2')
    expect(addressApi.setDefault).toHaveBeenCalledWith('2')
    expect(store.defaultId).toBe('2')
  })

  it('setDefault 失败（409 并发冲突）：回滚快照并重拉后重新抛出', async () => {
    const store = useAddressStore()
    vi.mocked(addressApi.list).mockResolvedValueOnce({
      items: [view('1', true), view('2')],
      defaultId: '1',
    })
    await store.fetchList()

    vi.mocked(addressApi.setDefault).mockRejectedValueOnce(new Error('默认地址冲突'))
    vi.mocked(addressApi.list).mockResolvedValueOnce({
      items: [view('1', true), view('2')],
      defaultId: '1',
    })
    await expect(store.setDefault('2')).rejects.toThrow('默认地址冲突')
    expect(store.items[0].id).toBe('1')
    expect(store.items[0].isDefault).toBe(true)
    expect(store.defaultId).toBe('1')
  })

  it('reset 清空缓存，退出/切换账号后不展示上个账号地址', () => {
    const store = useAddressStore()
    store.items = [view('1', true)]
    store.defaultId = '1'
    store.reset()
    expect(store.items).toEqual([])
    expect(store.defaultId).toBeNull()
    expect(store.loaded).toBe(false)
  })
})
