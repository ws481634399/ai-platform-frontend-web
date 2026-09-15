import { describe, expect, it } from 'vitest'
import {
  ADDRESS_LIMIT,
  DETAIL_MAX_LENGTH,
  buildAddressRequest,
  toFormValues,
  validateAddressForm,
  type AddressFormValues,
} from './address-form'
import type { ShippingAddressView } from '@/types/address'

const valid: AddressFormValues = {
  receiverName: '张三',
  receiverPhone: '13800138000',
  province: '浙江省',
  city: '杭州市',
  district: '西湖区',
  detailAddress: '文三路 100 号',
  postalCode: '310000',
}

describe('收货地址表单校验（STORY-003-01-03-01/TC-006 前置）', () => {
  it('合法表单无错误；邮编选填空串也通过', () => {
    expect(validateAddressForm(valid)).toEqual({})
    expect(validateAddressForm({ ...valid, postalCode: '   ' })).toEqual({})
  })

  it('收货人姓名：空白或超 32 字报错（trim 后判断）', () => {
    expect(validateAddressForm({ ...valid, receiverName: '   ' }).receiverName).toBe('收货人姓名不能为空')
    expect(
      validateAddressForm({ ...valid, receiverName: 'a'.repeat(33) }).receiverName,
    ).toBe('收货人姓名不能超过32字')
    expect(validateAddressForm({ ...valid, receiverName: ' 张三 ' })).toEqual({})
  })

  it('手机号：空或非大陆号段格式报错', () => {
    expect(validateAddressForm({ ...valid, receiverPhone: '' }).receiverPhone).toBe('收货人手机号不能为空')
    expect(validateAddressForm({ ...valid, receiverPhone: '12800138000' }).receiverPhone).toBe(
      '收货人手机号格式不正确',
    )
    expect(validateAddressForm({ ...valid, receiverPhone: '1380013800' }).receiverPhone).toBe(
      '收货人手机号格式不正确',
    )
  })

  it('省/市/区：空白或超 64 字报错', () => {
    expect(validateAddressForm({ ...valid, province: ' ' }).province).toBe('省份不能为空')
    expect(validateAddressForm({ ...valid, city: 'c'.repeat(65) }).city).toBe('城市不能超过64字')
    expect(validateAddressForm({ ...valid, district: '' }).district).toBe('区县不能为空')
  })

  it('详细地址：空白或超 128 字报错（SSOT 128，task-design 的 200 为笔误）', () => {
    expect(DETAIL_MAX_LENGTH).toBe(128)
    expect(validateAddressForm({ ...valid, detailAddress: '   ' }).detailAddress).toBe(
      '详细地址不能为空',
    )
    expect(
      validateAddressForm({ ...valid, detailAddress: 'x'.repeat(129) }).detailAddress,
    ).toBe('详细地址不能超过128字')
  })

  it('邮编：非空须为 6 位纯数字', () => {
    expect(validateAddressForm({ ...valid, postalCode: '31000' }).postalCode).toBe(
      '邮政编码必须为6位数字',
    )
    expect(validateAddressForm({ ...valid, postalCode: '31000a' }).postalCode).toBe(
      '邮政编码必须为6位数字',
    )
  })

  it('buildAddressRequest 全字段 trim，邮编空串归一为 null', () => {
    const request = buildAddressRequest({
      ...valid,
      receiverName: '  张三 ',
      detailAddress: ' 文三路 ',
      postalCode: '  ',
    })
    expect(request).toEqual({
      receiverName: '张三',
      receiverPhone: '13800138000',
      province: '浙江省',
      city: '杭州市',
      district: '西湖区',
      detailAddress: '文三路',
      postalCode: null,
    })
  })

  it('toFormValues 回填视图，postalCode null 转空串', () => {
    const view: ShippingAddressView = {
      ...valid,
      id: '1',
      isDefault: false,
      postalCode: null,
      createdAt: '',
      updatedAt: '',
    }
    const values = toFormValues(view)
    expect(values.postalCode).toBe('')
    expect(values.receiverName).toBe('张三')
  })

  it('ADDRESS_LIMIT 与后端上限 20 一致（B0202 409 的前置拦截阈值）', () => {
    expect(ADDRESS_LIMIT).toBe(20)
  })
})
