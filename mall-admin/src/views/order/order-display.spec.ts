import { describe, expect, it } from 'vitest'
import {
  compensationStatusLabel,
  fenToYuan,
  formatDateTime,
  operationBizLabel,
  operationLabel,
  statusLabel,
  statusTagType,
} from './order-display'

describe('order-display 订单展示工具', () => {
  it('订单状态中文映射，未知状态原样返回', () => {
    expect(statusLabel('PENDING_PAYMENT')).toBe('待付款')
    expect(statusLabel('PAID')).toBe('待发货')
    expect(statusLabel('SHIPPED')).toBe('待收货')
    expect(statusLabel('COMPLETED')).toBe('已完成')
    expect(statusLabel('CANCELLED')).toBe('已取消')
    expect(statusLabel('UNKNOWN')).toBe('UNKNOWN')
  })

  it('状态对应合法的 el-tag 类型', () => {
    expect(statusTagType('COMPLETED')).toBe('success')
    expect(statusTagType('CANCELLED')).toBe('info')
    expect(statusTagType('PENDING_PAYMENT')).toBe('warning')
  })

  it('操作码映射', () => {
    expect(operationLabel('SHIP')).toBe('发货')
    expect(operationLabel('CONFIRM_RECEIPT')).toBe('确认收货')
    expect(operationBizLabel('RELEASE_INVENTORY')).toBe('释放库存')
    expect(operationBizLabel('CONFIRM_INVENTORY')).toBe('确认扣减库存')
    expect(compensationStatusLabel('FAILED_DEAD')).toBe('已失败（人工介入）')
  })

  it('金额与时间格式化', () => {
    expect(fenToYuan(39900)).toBe('399.00')
    expect(formatDateTime(null)).toBe('—')
    expect(formatDateTime('bad')).toBe('—')
    expect(formatDateTime('2026-09-17T01:30:00Z')).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/)
  })
})
