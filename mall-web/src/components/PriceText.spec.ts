import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import PriceText from './PriceText.vue'

describe('PriceText 金额展示（整数分 → ¥，禁止浮点）', () => {
  it('9900 分 → ¥99.00', () => {
    const wrapper = mount(PriceText, { props: { value: 9900 } })
    expect(wrapper.text()).toBe('¥99.00')
  })

  it('19999 分 → ¥199.99', () => {
    const wrapper = mount(PriceText, { props: { value: 19999 } })
    expect(wrapper.text()).toBe('¥199.99')
  })

  it('5 分 → ¥0.05（padStart 补零）', () => {
    const wrapper = mount(PriceText, { props: { value: 5 } })
    expect(wrapper.text()).toBe('¥0.05')
  })

  it('null → ¥--', () => {
    const wrapper = mount(PriceText, { props: { value: null } })
    expect(wrapper.text()).toBe('¥--')
  })
})
