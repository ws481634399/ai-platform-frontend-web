// @vitest-environment jsdom
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createRouter, createMemoryHistory } from 'vue-router'

const catalogMocks = vi.hoisted(() => ({
  getCategoriesTree: vi.fn(),
  getBrands: vi.fn(),
}))

const searchStoreMocks = vi.hoisted(() => ({
  search: vi.fn().mockResolvedValue(undefined),
  items: [
    {
      productId: '90071992547409931',
      productName: '机械键盘',
      mainImage: null,
      minPrice: 19900,
      maxPrice: 19900,
      brandName: 'HHKB',
      categoryName: '数码',
    },
  ],
  total: 1,
  loading: false,
  error: '',
}))

const featuresMocks = vi.hoisted(() => ({
  hasFeature: vi.fn().mockReturnValue(true),
}))

vi.mock('@/api/catalog', () => ({
  catalogApi: catalogMocks,
}))

vi.mock('@/stores/search', () => ({
  useSearchStore: () => searchStoreMocks,
}))

vi.mock('@/stores/features', () => ({
  useFeaturesStore: () => featuresMocks,
}))

import SearchView from '@/views/search/SearchView.vue'

function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/search', name: 'search', component: { template: '<div />' } },
      { path: '/products/:id', name: 'product-detail', component: { template: '<div />' } },
    ],
  })
}

async function mountView(router = makeRouter()) {
  await router.push({ name: 'search', query: { keyword: '键盘' } })
  const wrapper = mount(SearchView, {
    global: {
      plugins: [router],
      stubs: { PriceText: true, StateView: false },
    },
  })
  await flushPromises()
  return { wrapper, router }
}

describe('SearchView 分类/品牌筛选与字符串 ID（CHG-0020 AC-015/AC-017）', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    catalogMocks.getCategoriesTree.mockResolvedValue([
      { id: '1', name: '数码', sort: 1, children: [
        { id: '11', name: '手机', sort: 1, children: [] },
      ] },
    ])
    catalogMocks.getBrands.mockResolvedValue({
      items: [{ id: '200', name: 'Apple', logoUrl: null, sort: 1 }],
      total: 1,
      page: 1,
      size: 200,
    })
  })

  it('挂载加载分类树/品牌并渲染筛选下拉（分类层级缩进）', async () => {
    const { wrapper } = await mountView()

    const category = wrapper.get('[data-testid="search-filter-category"]')
    const options = category.findAll('option').map((o) => o.text())
    expect(options).toContain('全部分类')
    expect(options.some((t) => t.includes('数码'))).toBe(true)
    expect(options.some((t) => t.includes('手机'))).toBe(true)

    const brand = wrapper.get('[data-testid="search-filter-brand"]')
    expect(brand.text()).toContain('全部品牌')
    expect(brand.text()).toContain('Apple')
  })

  it('选择分类后写入 URL query（page 重置），查询态携带字符串 categoryId', async () => {
    const { wrapper, router } = await mountView()

    await wrapper.get('[data-testid="search-filter-category"]').setValue('11')
    await flushPromises()

    expect(router.currentRoute.value.query.categoryId).toBe('11')
    expect(router.currentRoute.value.query.page).toBeUndefined()
    const lastCall = searchStoreMocks.search.mock.calls.at(-1)?.[0]
    expect(lastCall.categoryId).toBe('11')
  })

  it('结果卡片 productId 为字符串：雪花长 ID 原样用于详情跳转，不丢精度', async () => {
    const { wrapper, router } = await mountView()

    await wrapper.get('[data-testid="search-card-90071992547409931"]').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.fullPath).toBe('/products/90071992547409931')
  })
})
