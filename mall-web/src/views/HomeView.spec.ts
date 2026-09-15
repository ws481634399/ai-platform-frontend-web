import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createRouter, createMemoryHistory } from 'vue-router'

const catalogMocks = vi.hoisted(() => ({
  getHome: vi.fn(),
}))

vi.mock('@/api/catalog', () => ({
  catalogApi: catalogMocks,
  CategoryEntry: {},
  ProductCard: {},
  RecommendItem: {},
  Banner: {},
  HomeView: {},
}))

import HomeView from '@/views/HomeView.vue'
import type { HomeView as HomeData } from '@/api/catalog'

function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: { template: '<div />' } },
      { path: '/products', name: 'products', component: { template: '<div />' } },
      { path: '/products/:id', name: 'product-detail', component: { template: '<div />' } },
    ],
  })
}

function emptyHome(): HomeData {
  return { categoryEntries: [], newArrivals: [], recommends: [], banners: [] }
}

function fullHome(): HomeData {
  return {
    categoryEntries: [{ id: '1', name: '数码', iconImageUrl: null }],
    newArrivals: [
      { id: '101', name: '商品一', mainImageUrl: 'img1', minPrice: 9900, maxPrice: 9900 },
    ],
    recommends: [
      { id: '101', name: '商品一', mainImageUrl: 'img1', minPrice: 9900, maxPrice: 9900, source: 'FALLBACK_NEWEST' },
    ],
    banners: [],
  }
}

describe('HomeView 商城首页（四态 + 路由）', () => {
  beforeEach(() => vi.clearAllMocks())

  it('loading 态渲染 loading 占位', async () => {
    catalogMocks.getHome.mockImplementationOnce(() => new Promise(() => {})) // 永不 resolve
    const wrapper = mount(HomeView, {
      global: { plugins: [makeRouter()] },
    })
    await flushPromises()
    expect(wrapper.find('[data-testid="state-loading"]').exists()).toBe(true)
  })

  it('error 态渲染错误文案与重试按钮，点击重试重新调用 getHome', async () => {
    catalogMocks.getHome.mockRejectedValueOnce(new Error('boom'))
    const router = makeRouter()
    const wrapper = mount(HomeView, { global: { plugins: [router] } })
    await flushPromises()

    expect(wrapper.find('[data-testid="state-error"]').exists()).toBe(true)
    expect(catalogMocks.getHome).toHaveBeenCalledTimes(1)

    catalogMocks.getHome.mockResolvedValueOnce(emptyHome())
    await wrapper.find('[data-testid="state-retry"]').trigger('click')
    await flushPromises()
    expect(catalogMocks.getHome).toHaveBeenCalledTimes(2)
  })

  it('空态（全空数组）渲染 empty 占位', async () => {
    catalogMocks.getHome.mockResolvedValueOnce(emptyHome())
    const wrapper = mount(HomeView, { global: { plugins: [makeRouter()] } })
    await flushPromises()
    expect(wrapper.find('[data-testid="state-empty"]').exists()).toBe(true)
  })

  it('success 态渲染分类/新品/推荐，分类点击 push /products?categoryId=，卡片点击 push /products/:id', async () => {
    catalogMocks.getHome.mockResolvedValueOnce(fullHome())
    const router = makeRouter()
    const wrapper = mount(HomeView, { global: { plugins: [router] } })
    await flushPromises()

    expect(wrapper.find('[data-testid="home-categories"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="category-1"]').exists()).toBe(true)
    expect(wrapper.findAll('[data-testid="product-card"]').length).toBe(2)

    // 分类点击 → /products?categoryId=1
    await wrapper.find('[data-testid="category-1"]').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.fullPath).toBe('/products?categoryId=1')

    // 卡片点击 → /products/101
    await router.push('/')
    await wrapper.findAll('[data-testid="product-card"]')[0].trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.fullPath).toBe('/products/101')
  })
})
