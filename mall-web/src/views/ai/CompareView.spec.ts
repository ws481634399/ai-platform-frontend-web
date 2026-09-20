import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const aiMocks = vi.hoisted(() => ({
  compare: vi.fn(),
}))
const searchMocks = vi.hoisted(() => ({
  products: vi.fn(),
}))

vi.mock('@/api/ai', () => ({
  aiApi: aiMocks,
}))
vi.mock('@/api/search', () => ({
  searchApi: searchMocks,
}))

import CompareView from '@/views/ai/CompareView.vue'

function searchPage() {
  return {
    items: [
      {
        productId: '1001',
        productName: '轻薄本 Air',
        mainImage: null,
        minPrice: 499900,
        maxPrice: 499900,
        brandName: '品牌A',
        categoryName: '笔记本',
      },
      {
        productId: '1002',
        productName: '轻薄本 Pro',
        mainImage: null,
        minPrice: 599900,
        maxPrice: 649900,
        brandName: '品牌B',
        categoryName: '笔记本',
      },
    ],
    total: 2,
    page: 1,
    size: 20,
  }
}

function compareResponse() {
  return {
    comparisonDimensions: [
      {
        dimension: '价格',
        values: { '1001': '4999.00', '1002': '5999.00~6499.00' },
      },
      {
        dimension: 'GPU',
        values: { '1001': '核显' },
      },
    ],
    products: [
      { productId: '1001', productName: '轻薄本 Air', image: null, price: '4999.00' },
      { productId: '1002', productName: '轻薄本 Pro', image: null, price: '5999.00' },
    ],
    summary: '预算有限选 Air，追求性能与屏幕选 Pro。',
  }
}

function mountView() {
  return mount(CompareView, {
    global: {
      config: {
        warnHandler: () => null,
      },
    },
  })
}

async function search(wrapper: ReturnType<typeof mountView>, keyword = '轻薄本') {
  await wrapper.find('[data-testid="compare-search-input"]').setValue(keyword)
  await wrapper.find('[data-testid="compare-search-form"]').trigger('submit')
  await flushPromises()
}

async function pickAndCompare(wrapper: ReturnType<typeof mountView>) {
  const checkboxes = wrapper.findAll('[data-testid="compare-checkbox"]')
  for (const box of checkboxes) {
    await box.setValue(true)
  }
  await wrapper.find('[data-testid="compare-submit"]').trigger('click')
  await flushPromises()
}

describe('CompareView AI 商品对比', () => {
  beforeEach(() => vi.clearAllMocks())

  it('搜索→勾选→对比：表格按维度行/商品列渲染，缺失单元格"暂无该项数据"', async () => {
    searchMocks.products.mockResolvedValueOnce(searchPage())
    aiMocks.compare.mockResolvedValueOnce(compareResponse())
    const wrapper = mountView()

    await search(wrapper)
    expect(searchMocks.products).toHaveBeenCalledWith({ keyword: '轻薄本', page: 1, size: 20 })
    expect(wrapper.findAll('[data-testid="compare-candidate"]').length).toBe(2)

    await pickAndCompare(wrapper)
    expect(aiMocks.compare).toHaveBeenCalledWith({ productIds: ['1001', '1002'], question: undefined })

    const rows = wrapper.findAll('[data-testid="compare-dimension-row"]')
    expect(rows.length).toBe(2)
    expect(wrapper.text()).toContain('￥4999.00')
    // 1002 的 GPU 缺失
    const gpuCells = rows[1].findAll('td')
    expect(gpuCells[1].text()).toBe('暂无该项数据')
    expect(wrapper.text()).toContain('价格以结算页为准')
  })

  it('场景问题随请求透传，AI 总结区渲染', async () => {
    searchMocks.products.mockResolvedValueOnce(searchPage())
    aiMocks.compare.mockResolvedValueOnce(compareResponse())
    const wrapper = mountView()

    await search(wrapper)
    const checkboxes = wrapper.findAll('[data-testid="compare-checkbox"]')
    for (const box of checkboxes) {
      await box.setValue(true)
    }
    await wrapper.find('[data-testid="compare-question"]').setValue('哪个性价比高')
    await wrapper.find('[data-testid="compare-submit"]').trigger('click')
    await flushPromises()

    expect(aiMocks.compare).toHaveBeenCalledWith({ productIds: ['1001', '1002'], question: '哪个性价比高' })
    expect(wrapper.find('[data-testid="compare-summary"]').text()).toContain('追求性能与屏幕选 Pro')
  })

  it('未选满 2 件时提交按钮禁用', async () => {
    searchMocks.products.mockResolvedValueOnce(searchPage())
    const wrapper = mountView()
    await search(wrapper)

    const boxes = wrapper.findAll('[data-testid="compare-checkbox"]')
    await boxes[0].setValue(true)
    expect((wrapper.find('[data-testid="compare-submit"]').element as HTMLButtonElement).disabled).toBe(true)
    expect(aiMocks.compare).not.toHaveBeenCalled()
  })

  it('403 开关关闭：渲染"AI 对比暂未开启"空态', async () => {
    searchMocks.products.mockResolvedValueOnce(searchPage())
    const error = Object.assign(new Error('forbidden'), { response: { status: 403 } })
    aiMocks.compare.mockRejectedValueOnce(error)
    const wrapper = mountView()

    await search(wrapper)
    await pickAndCompare(wrapper)
    expect(wrapper.find('[data-testid="state-disabled"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('AI 对比暂未开启')
  })

  it('5xx：错误态 + 重试按钮，重试复用上一次请求', async () => {
    searchMocks.products.mockResolvedValueOnce(searchPage())
    const error = Object.assign(new Error('bad gateway'), { response: { status: 502 } })
    aiMocks.compare.mockRejectedValueOnce(error)
    const wrapper = mountView()

    await search(wrapper)
    await pickAndCompare(wrapper)
    expect(wrapper.find('[data-testid="state-error"]').exists()).toBe(true)

    aiMocks.compare.mockResolvedValueOnce(compareResponse())
    await wrapper.find('[data-testid="state-retry"]').trigger('click')
    await flushPromises()
    expect(aiMocks.compare).toHaveBeenLastCalledWith({ productIds: ['1001', '1002'], question: undefined })
    expect(wrapper.find('[data-testid="compare-result"]').exists()).toBe(true)
  })
})
