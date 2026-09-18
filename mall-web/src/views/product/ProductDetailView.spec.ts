// @vitest-environment jsdom
// DOMPurify 在 happy-dom 下能力降级，净化行为用 jsdom 环境验证（真实浏览器同理）
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createRouter, createMemoryHistory } from 'vue-router'

const catalogMocks = vi.hoisted(() => ({
  getProductDetail: vi.fn(),
  getSkuAvailability: vi.fn(),
}))

const cartMocks = vi.hoisted(() => ({
  addItem: vi.fn(),
}))

const checkoutMocks = vi.hoisted(() => ({
  startBuyNow: vi.fn(),
}))

const memberMocks = vi.hoisted(() => ({
  isAuthenticated: true,
  restore: vi.fn().mockResolvedValue(true),
}))

const featuresMocks = vi.hoisted(() => ({
  hasFeature: vi.fn().mockReturnValue(true),
}))

vi.mock('@/api/catalog', () => ({
  catalogApi: catalogMocks,
}))

vi.mock('@/stores/cart', () => ({
  useCartStore: () => cartMocks,
}))

vi.mock('@/stores/checkout', () => ({
  useCheckoutStore: () => checkoutMocks,
}))

vi.mock('@/stores/member', () => ({
  useMemberStore: () => memberMocks,
}))

vi.mock('@/stores/features', () => ({
  useFeaturesStore: () => featuresMocks,
}))

import ProductDetailView from '@/views/product/ProductDetailView.vue'
import type { ProductDetail } from '@/api/catalog'

function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/products/:id', name: 'product-detail', component: { template: '<div />' } },
      { path: '/products', name: 'product-list', component: { template: '<div />' } },
      { path: '/', name: 'home', component: { template: '<div />' } },
    ],
  })
}

function fullDetail(): ProductDetail {
  return {
    id: '101',
    productCode: 'P1',
    productName: 'iPhone',
    subtitle: '副标题',
    description: '<p>正文<script>alert(1)</script></p>',
    categoryId: '11',
    brandId: '200',
    brandName: 'Apple',
    categoryPath: [
      { id: '1', name: '数码' },
      { id: '11', name: '手机' },
    ],
    mainImageUrl: 'main.jpg',
    images: [{ id: '1', imageUrl: 'main.jpg', imageType: 'MAIN', sortOrder: 1, mainFlag: true }],
    attributes: [],
    skus: [],
    dimensionsOrder: ['颜色', '尺码'],
    specDimensions: [
      { name: '颜色', values: ['红', '蓝'] },
      { name: '尺码', values: ['L'] },
    ],
    skuIndex: {
      '红|L': { skuId: '1', priceFen: 9900, imageUrl: null, status: 'ENABLED' },
      '蓝|L': { skuId: '2', priceFen: 10900, imageUrl: null, status: 'ENABLED' },
    },
    status: 'ON_SALE',
  }
}

async function mountView() {
  const router = makeRouter()
  await router.push('/products/101')
  const wrapper = mount(ProductDetailView, {
    global: {
      plugins: [router],
      stubs: {
        SkuSelector: {
          props: ['dimensions', 'skuIndex', 'dimensionsOrder'],
          template: '<div class="sku-stub" />',
        },
      },
    },
  })
  await flushPromises()
  return wrapper
}

describe('ProductDetailView 商品详情页', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    memberMocks.isAuthenticated = true
    vi.mocked(featuresMocks.hasFeature).mockReturnValue(true)
    catalogMocks.getSkuAvailability.mockResolvedValue([
      { skuId: '1', stockStatus: 'IN_STOCK' },
      { skuId: '2', stockStatus: 'OUT_OF_STOCK' },
    ])
    cartMocks.addItem.mockResolvedValue({ success: true })
  })

  it('加载成功渲染名称/品牌/面包屑并查询可售状态', async () => {
    catalogMocks.getProductDetail.mockResolvedValue(fullDetail())
    const wrapper = await mountView()
    expect(wrapper.find('.info__name').text()).toContain('iPhone')
    expect(wrapper.find('.info__brand').text()).toContain('Apple')
    expect(wrapper.find('.breadcrumb').text()).toContain('数码')
    expect(catalogMocks.getSkuAvailability).toHaveBeenCalledWith(['1', '2'])
  })

  it('富文本经净化（script 被剥离）', async () => {
    catalogMocks.getProductDetail.mockResolvedValue(fullDetail())
    const wrapper = await mountView()
    const html = wrapper.find('.rich-text').html()
    expect(html).toContain('<p>正文</p>')
    expect(html).not.toContain('<script>')
  })

  it('404 渲染不存在态且无加购入口', async () => {
    catalogMocks.getProductDetail.mockRejectedValue({ response: { status: 404 } })
    const wrapper = await mountView()
    expect(wrapper.find('.not-found').exists()).toBe(true)
    expect(wrapper.find('[data-testid="add-cart-btn"]').exists()).toBe(false)
  })

  it('未选齐 SKU 时加购按钮禁用', async () => {
    catalogMocks.getProductDetail.mockResolvedValue(fullDetail())
    const wrapper = await mountView()
    expect(wrapper.find('[data-testid="add-cart-btn"]').attributes('disabled')).toBeDefined()
  })

  it('FE-504 游客且游客车开关关闭：加购按钮禁用并展示登录引导，不触发加购', async () => {
    catalogMocks.getProductDetail.mockResolvedValue(fullDetail())
    memberMocks.isAuthenticated = false
    vi.mocked(featuresMocks.hasFeature).mockReturnValue(false)
    const wrapper = await mountView()

    const addBtn = wrapper.find('[data-testid="add-cart-btn"]')
    expect(addBtn.attributes('disabled')).toBeDefined()
    const hint = wrapper.find('[data-testid="guest-cart-blocked-hint"]')
    expect(hint.exists()).toBe(true)
    expect(hint.text()).toContain('游客购物车暂未开放')
    expect(hint.text()).toContain('请登录后加购')
    expect(cartMocks.addItem).not.toHaveBeenCalled()
  })

  it('FE-504 开关缺省（fail-open）游客仍可见加购入口且无拦截提示', async () => {
    catalogMocks.getProductDetail.mockResolvedValue(fullDetail())
    memberMocks.isAuthenticated = false
    vi.mocked(featuresMocks.hasFeature).mockReturnValue(true)
    const wrapper = await mountView()
    // 未选 SKU 时按钮仍禁用，但不应出现游客车关闭提示
    expect(wrapper.find('[data-testid="guest-cart-blocked-hint"]').exists()).toBe(false)
  })
})
