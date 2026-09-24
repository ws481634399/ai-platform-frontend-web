import { describe, expect, it } from 'vitest'
import { delayStatusLabel, delayStatusTagType } from './delay-display'

describe('delayStatusTagType', () => {
  it('PENDING=warning，CANCELLED=success，FAILED=danger', () => {
    expect(delayStatusTagType('PENDING')).toBe('warning')
    expect(delayStatusTagType('CANCELLED')).toBe('success')
    expect(delayStatusTagType('FAILED')).toBe('danger')
  })
})

describe('delayStatusLabel', () => {
  it('中文状态映射', () => {
    expect(delayStatusLabel('PENDING')).toBe('待取消')
    expect(delayStatusLabel('CANCELLED')).toBe('已取消')
    expect(delayStatusLabel('FAILED')).toBe('失败')
  })
})
