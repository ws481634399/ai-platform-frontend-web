import { beforeEach, describe, expect, it, vi } from 'vitest'

const httpMocks = vi.hoisted(() => ({
  get: vi.fn(),
  put: vi.fn(),
  post: vi.fn(),
  delete: vi.fn(),
}))

vi.mock('@/api/http', () => ({ default: httpMocks }))

import { addressApi } from './address'
import type { ShippingAddressView } from '@/types/address'

function envelope<T>(data: T) {
  return {
    data: { success: true, code: '0', message: 'ok', traceId: 't', data },
  }
}

const address: ShippingAddressView = {
  id: '760000000000000001',
  receiverName: '张三',
  receiverPhone: '13800138000',
  province: '浙江省',
  city: '杭州市',
  district: '西湖区',
  detailAddress: '文三路 100 号',
  postalCode: '310000',
  isDefault: true,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}

describe('收货地址 API（STORY-003-01-03-01 契约）', () => {
  beforeEach(() => vi.clearAllMocks())

  it('list 命中 GET 列表端点并解包 items/defaultId', async () => {
    httpMocks.get.mockResolvedValueOnce(envelope({ items: [address], defaultId: address.id }))
    const result = await addressApi.list()
    expect(httpMocks.get).toHaveBeenCalledWith('/api/mall/shipping-addresses')
    expect(result.items).toHaveLength(1)
    expect(result.defaultId).toBe(address.id)
  })

  it('create 以 POST 提交请求体并返回 201 视图', async () => {
    httpMocks.post.mockResolvedValueOnce(envelope(address))
    const request = {
      receiverName: '张三',
      receiverPhone: '13800138000',
      province: '浙江省',
      city: '杭州市',
      district: '西湖区',
      detailAddress: '文三路 100 号',
      postalCode: null,
    }
    const created = await addressApi.create(request)
    expect(httpMocks.post).toHaveBeenCalledWith('/api/mall/shipping-addresses', request)
    expect(created.id).toBe(address.id)
  })

  it('update 命中 PUT /{id} 并解包', async () => {
    httpMocks.put.mockResolvedValueOnce(envelope(address))
    await addressApi.update(address.id, { receiverName: '李四' } as never)
    expect(httpMocks.put).toHaveBeenCalledWith(
      `/api/mall/shipping-addresses/${address.id}`,
      { receiverName: '李四' },
    )
  })

  it('remove 命中 DELETE /{id}（204 不解包）', async () => {
    httpMocks.delete.mockResolvedValueOnce(undefined)
    await addressApi.remove(address.id)
    expect(httpMocks.delete).toHaveBeenCalledWith(`/api/mall/shipping-addresses/${address.id}`)
  })

  it('setDefault 命中 PUT /{id}/default（SSOT：DU-BE-604 DEV-3）', async () => {
    httpMocks.put.mockResolvedValueOnce(envelope(address))
    const result = await addressApi.setDefault(address.id)
    expect(httpMocks.put).toHaveBeenCalledWith(
      `/api/mall/shipping-addresses/${address.id}/default`,
    )
    expect(result.isDefault).toBe(true)
  })

  it('getDefault 命中 GET /default，无默认时 item=null', async () => {
    httpMocks.get.mockResolvedValueOnce(envelope({ item: null }))
    const result = await addressApi.getDefault()
    expect(httpMocks.get).toHaveBeenCalledWith('/api/mall/shipping-addresses/default')
    expect(result.item).toBeNull()
  })
})
