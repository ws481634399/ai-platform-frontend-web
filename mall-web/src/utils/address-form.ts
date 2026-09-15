/**
 * 收货地址表单规则（CHG-0016 / DU-FE-603），与后端 ShippingAddress 聚合规则保持一致：
 * - 收货人：1-32 字非空白；手机：^1[3-9]\d{9}$；
 * - 省/市/区：1-64 字；详细地址：1-128 字（SSOT story-spec §3；DU-FE task-design 的 200 为笔误）；
 * - 邮编：可空，非空须为 6 位数字。
 * 前端为体验前置拦截，服务端 Bean Validation/聚合仍会重新校验（安全边界在后端）。
 */

export const RECEIVER_NAME_MAX_LENGTH = 32
export const REGION_MAX_LENGTH = 64
export const DETAIL_MAX_LENGTH = 128
export const ADDRESS_LIMIT = 20

const PHONE_PATTERN = /^1[3-9]\d{9}$/
const POSTAL_CODE_PATTERN = /^\d{6}$/

export interface AddressFormValues {
  receiverName: string
  receiverPhone: string
  province: string
  city: string
  district: string
  detailAddress: string
  postalCode: string
}

/** 字段名 → 中文错误（无错误字段缺省）。 */
export type AddressFieldErrors = Partial<Record<keyof AddressFormValues, string>>

function required(value: string, maxLength: number, field: string, errors: AddressFieldErrors, key: keyof AddressFormValues) {
  const trimmed = value.trim()
  if (!trimmed) {
    errors[key] = `${field}不能为空`
  } else if (trimmed.length > maxLength) {
    errors[key] = `${field}不能超过${maxLength}字`
  }
}

/** 校验地址表单；返回各字段错误（空对象表示通过）。 */
export function validateAddressForm(input: AddressFormValues): AddressFieldErrors {
  const errors: AddressFieldErrors = {}
  required(input.receiverName, RECEIVER_NAME_MAX_LENGTH, '收货人姓名', errors, 'receiverName')

  const phone = input.receiverPhone.trim()
  if (!phone) {
    errors.receiverPhone = '收货人手机号不能为空'
  } else if (!PHONE_PATTERN.test(phone)) {
    errors.receiverPhone = '收货人手机号格式不正确'
  }

  required(input.province, REGION_MAX_LENGTH, '省份', errors, 'province')
  required(input.city, REGION_MAX_LENGTH, '城市', errors, 'city')
  required(input.district, REGION_MAX_LENGTH, '区县', errors, 'district')
  required(input.detailAddress, DETAIL_MAX_LENGTH, '详细地址', errors, 'detailAddress')

  const postalCode = input.postalCode.trim()
  if (postalCode && !POSTAL_CODE_PATTERN.test(postalCode)) {
    errors.postalCode = '邮政编码必须为6位数字'
  }
  return errors
}

/** 构造提交体：统一 trim；邮编空串归一为 null。 */
export function buildAddressRequest(input: AddressFormValues): import('@/types/address').AddressUpsertRequest {
  return {
    receiverName: input.receiverName.trim(),
    receiverPhone: input.receiverPhone.trim(),
    province: input.province.trim(),
    city: input.city.trim(),
    district: input.district.trim(),
    detailAddress: input.detailAddress.trim(),
    postalCode: input.postalCode.trim() || null,
  }
}

/** 由地址视图回填编辑表单（postalCode null → 空串）。 */
export function toFormValues(view: import('@/types/address').ShippingAddressView): AddressFormValues {
  return {
    receiverName: view.receiverName,
    receiverPhone: view.receiverPhone,
    province: view.province,
    city: view.city,
    district: view.district,
    detailAddress: view.detailAddress,
    postalCode: view.postalCode ?? '',
  }
}
