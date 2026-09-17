import { describe, expect, it } from 'vitest'
import {
  canCancel,
  canConfirmReceipt,
  canPay,
  fenToYuan,
  formatDateTime,
  issueLabel,
  orderStatusLabel,
  stockStatusLabel,
} from './order'

describe('order utils', () => {
  it('状态码映射中文文案，未知码原样返回', () => {
    expect(orderStatusLabel('PENDING_PAYMENT')).toBe('待付款')
    expect(orderStatusLabel('PAID')).toBe('待发货')
    expect(orderStatusLabel('SHIPPED')).toBe('待收货')
    expect(orderStatusLabel('COMPLETED')).toBe('已完成')
    expect(orderStatusLabel('CANCELLED')).toBe('已取消')
    expect(orderStatusLabel('WHATEVER')).toBe('WHATEVER')
  })

  it('库存状态与问题码映射', () => {
    expect(stockStatusLabel('OK')).toBe('现货充足')
    expect(stockStatusLabel('LOW')).toBe('库存紧张')
    expect(stockStatusLabel('OUT_OF_STOCK')).toBe('已售罄')
    expect(issueLabel('SKU_NOT_SALABLE')).toBe('商品已下架或不可售')
    expect(issueLabel('OUT_OF_STOCK')).toBe('库存不足')
    expect(issueLabel('UNKNOWN_X')).toBe('UNKNOWN_X')
  })

  it('操作按钮仅与合法来源态匹配（最终校验仍在后端）', () => {
    expect(canPay('PENDING_PAYMENT')).toBe(true)
    expect(canPay('PAID')).toBe(false)
    expect(canPay('CANCELLED')).toBe(false)
    expect(canCancel('PENDING_PAYMENT')).toBe(true)
    expect(canConfirmReceipt('SHIPPED')).toBe(true)
    expect(canConfirmReceipt('PAID')).toBe(false)
  })

  it('分转元保留两位小数', () => {
    expect(fenToYuan(0)).toBe('0.00')
    expect(fenToYuan(39900)).toBe('399.00')
    expect(fenToYuan(105)).toBe('1.05')
  })

  it('时间格式化与空值占位', () => {
    expect(formatDateTime(null)).toBe('—')
    expect(formatDateTime('not-a-date')).toBe('—')
    const text = formatDateTime('2026-09-17T01:30:00Z')
    expect(text).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/)
  })
})
