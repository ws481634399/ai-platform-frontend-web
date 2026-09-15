import http from './http'
import type { ApiResponse } from '@/types'
import type {
  AddressListResponse,
  AddressUpsertRequest,
  DefaultAddressResponse,
  ShippingAddressView,
} from '@/types/address'

function unwrap<T>(response: { data: ApiResponse<T> }): T {
  return response.data.data
}

/**
 * 收货地址 API（CHG-0016 STORY-003-01-03-01；端点经网关 8080 路由至 member 8102）。
 * 路径 SSOT：story-design §2（set-default 动作为 PUT /{id}/default，见 DU-BE-604 DEV-3）。
 */
export const addressApi = {
  async list(): Promise<AddressListResponse> {
    return unwrap<AddressListResponse>(await http.get('/api/mall/shipping-addresses'))
  },

  async create(request: AddressUpsertRequest): Promise<ShippingAddressView> {
    return unwrap<ShippingAddressView>(await http.post('/api/mall/shipping-addresses', request))
  },

  async update(id: string, request: AddressUpsertRequest): Promise<ShippingAddressView> {
    return unwrap<ShippingAddressView>(
      await http.put(`/api/mall/shipping-addresses/${id}`, request),
    )
  },

  /** 删除成功后端返回 204 无信封。 */
  async remove(id: string): Promise<void> {
    await http.delete(`/api/mall/shipping-addresses/${id}`)
  },

  async setDefault(id: string): Promise<ShippingAddressView> {
    return unwrap<ShippingAddressView>(
      await http.put(`/api/mall/shipping-addresses/${id}/default`),
    )
  },

  async getDefault(): Promise<DefaultAddressResponse> {
    return unwrap<DefaultAddressResponse>(await http.get('/api/mall/shipping-addresses/default'))
  },
}
