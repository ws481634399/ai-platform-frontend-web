import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SkuSelector from '@/components/SkuSelector.vue'
import type { SpecDimension, SkuIndexEntry } from '@/api/catalog'

function makeFixture() {
  const dimensions: SpecDimension[] = [
    { name: '颜色', values: ['红', '蓝'] },
    { name: '尺码', values: ['L', 'XL'] },
  ]
  const skuIndex: Record<string, SkuIndexEntry> = {
    '红|L': { skuId: '1', priceFen: 100, imageUrl: null, status: 'ENABLED' },
    '红|XL': { skuId: '2', priceFen: 110, imageUrl: null, status: 'ENABLED' },
    '蓝|L': { skuId: '3', priceFen: 120, imageUrl: null, status: 'ENABLED' },
    '蓝|XL': { skuId: '4', priceFen: 130, imageUrl: null, status: 'DISABLED' },
  }
  return { dimensions, skuIndex, dimensionsOrder: ['颜色', '尺码'] }
}

describe('SkuSelector', () => {
  it('选齐维度后命中唯一 SKU', async () => {
    const { dimensions, skuIndex, dimensionsOrder } = makeFixture()
    const wrapper = mount(SkuSelector, { props: { dimensions, skuIndex, dimensionsOrder } })
    const buttons = wrapper.findAll('.dim-value')
    // 点击 红
    await buttons[0].trigger('click')
    // 点击 L（第三个按钮，第二个维度的第一个值）
    await buttons[2].trigger('click')
    const lastPayload = wrapper.emitted('change')?.at(-1)?.[0] as { skuId: string } | null
    expect(lastPayload?.skuId).toBe('1')
  })

  it('未选齐时 change 传 null', async () => {
    const { dimensions, skuIndex, dimensionsOrder } = makeFixture()
    const wrapper = mount(SkuSelector, { props: { dimensions, skuIndex, dimensionsOrder } })
    await wrapper.findAll('.dim-value')[0].trigger('click')
    expect(wrapper.emitted('change')?.at(-1)?.[0]).toBeNull()
  })

  it('DISABLED 组合值置灰不可选', async () => {
    const { dimensions, skuIndex, dimensionsOrder } = makeFixture()
    const wrapper = mount(SkuSelector, { props: { dimensions, skuIndex, dimensionsOrder } })
    const buttons = wrapper.findAll('.dim-value')
    // 选 蓝
    await buttons[1].trigger('click')
    // XL 应被禁用（蓝|XL = DISABLED）
    const xlBtn = buttons[3]
    expect(xlBtn.classes()).toContain('disabled')
    expect(xlBtn.attributes('disabled')).toBeDefined()
  })

  it('三维度初始无选择时所有值均可点（无组合时不误禁用）', () => {
    const dimensions: SpecDimension[] = [
      { name: '颜色', values: ['红', '蓝'] },
      { name: '尺码', values: ['L', 'XL'] },
      { name: '款式', values: ['标准', '加厚'] },
    ]
    const skuIndex: Record<string, SkuIndexEntry> = {
      '红|L|标准': { skuId: '1', priceFen: 100, imageUrl: null, status: 'ENABLED' },
      '蓝|XL|加厚': { skuId: '2', priceFen: 110, imageUrl: null, status: 'ENABLED' },
    }
    const wrapper = mount(SkuSelector, {
      props: { dimensions, skuIndex, dimensionsOrder: ['颜色', '尺码', '款式'] },
    })
    // 每个值至少存在一个兼容启用组合 → 无 disabled
    for (const btn of wrapper.findAll('.dim-value')) {
      expect(btn.attributes('disabled')).toBeUndefined()
    }
  })
})
