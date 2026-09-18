import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import StockBadge from '@/components/StockBadge.vue'

describe('StockBadge', () => {
  it('IN_STOCK 显示现货', () => {
    const w = mount(StockBadge, { props: { status: 'IN_STOCK' } })
    expect(w.text()).toContain('现货')
    expect(w.classes()).toContain('in_stock')
  })
  it('OUT_OF_STOCK 显示缺货', () => {
    const w = mount(StockBadge, { props: { status: 'OUT_OF_STOCK' } })
    expect(w.text()).toContain('缺货')
  })
  it('UNKNOWN 显示重试按钮', async () => {
    const w = mount(StockBadge, { props: { status: 'UNKNOWN' } })
    expect(w.text()).toContain('状态获取失败')
    const btn = w.find('.stock-badge__retry')
    expect(btn.exists()).toBe(true)
    await btn.trigger('click')
    expect(w.emitted('retry')).toBeTruthy()
  })
})
