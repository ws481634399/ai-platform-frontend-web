/**
 * 收货地址相关类型（CHG-0016 STORY-003-01-03-01 / DU-FE-603）。
 * 契约对齐后端 ShippingAddressDtos：AddressView / AddressListResponse / DefaultAddressResponse。
 */

/** GET 单条/写操作返回的地址视图（无 memberId；id 为字符串雪花 ID） */
export interface ShippingAddressView {
  id: string
  receiverName: string
  receiverPhone: string
  province: string
  city: string
  district: string
  detailAddress: string
  postalCode: string | null
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

/**
 * 新增/修改请求体。memberId 永不出参入参（SSOT：story-design §2）；
 * postalCode 空串/缺省表示不填邮编（前端在提交前归一为 null）。
 */
export interface AddressUpsertRequest {
  receiverName: string
  receiverPhone: string
  province: string
  city: string
  district: string
  detailAddress: string
  postalCode?: string | null
}

/** GET /api/mall/shipping-addresses 列表响应：defaultId 无默认时为 null */
export interface AddressListResponse {
  items: ShippingAddressView[]
  defaultId: string | null
}

/** GET /api/mall/shipping-addresses/default：无默认时 item=null（HTTP 200） */
export interface DefaultAddressResponse {
  item: ShippingAddressView | null
}
