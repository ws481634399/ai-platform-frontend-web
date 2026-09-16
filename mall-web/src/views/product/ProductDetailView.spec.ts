// @vitest-environment jsdom
// DOMPurify 在 happy-dom 下能力降级，净化行为用 jsdom 环境验证（真实浏览器同理）
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createRouter, createMemoryHistory } from 'vue-router'

const catalogMocks = vi.hoisted(() => ({
  getProductDetail: vi.fn(),
  getSkuAvailability: vi.fn(),
}))

vi.mock('@/api/catalog', () => ({
  catalogApi: catalogMocks,
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
    catalogMocks.getSkuAvailability.mockResolvedValue([
      { skuId: '1', stockStatus: 'IN_STOCK' },
      { skuId: '2', stockStatus: 'OUT_OF_STOCK' },
    ])
  })

  it('加载成功渲染名称/品牌/面包屑并查询可售状态', async () => {
    catalogMocks.getProductDetail.mockResolvedValue(fullDetail())
    const wrapper = await mountView()
    expect(wrapper.find('.name').text()).toContain('iPhone')
    expect(wrapper.find('.brand').text()).toContain('Apple')
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
    expect(wrapper.find('.add-cart-btn').exists()).toBe(false)
  })

  it('未选齐 SKU 时加购按钮禁用', async () => {
    catalogMocks.getProductDetail.mockResolvedValue(fullDetail())
    const wrapper = await mountView()
    expect(wrapper.find('.add-cart-btn').attributes('disabled')).toBeDefined()
  })
})
