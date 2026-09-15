import { beforeEach, describe, expect, it, vi } from 'vitest'

const httpMocks = vi.hoisted(() => ({
  get: vi.fn(),
}))

vi.mock('@/api/http', () => ({ default: httpMocks }))

import { catalogApi, serializeProductQuery } from './catalog'

function envelope<T>(data: T) {
  return {
    data: { success: true, code: '0', message: 'ok', traceId: 't', data },
  }
}

describe('商城商品浏览 API（CHG-0017）', () => {
  beforeEach(() => vi.clearAllMocks())

  it('getHome 命中 GET /api/mall/home 并解包 HomeView', async () => {
    httpMocks.get.mockResolvedValueOnce(
      envelope({
        categoryEntries: [{ id: '1', name: '数码', iconImageUrl: null }],
        newArrivals: [],
        recommends: [],
        banners: [],
      }),
    )
    const home = await catalogApi.getHome()
    expect(httpMocks.get).toHaveBeenCalledWith('/api/mall/home')
    expect(home.categoryEntries[0].id).toBe('1')
  })

  it('getCategoriesTree 命中 GET /api/mall/categories/tree', async () => {
    httpMocks.get.mockResolvedValueOnce(envelope([{ id: '1', name: '数码', sort: 1, children: [] }]))
    const tree = await catalogApi.getCategoriesTree()
    expect(httpMocks.get).toHaveBeenCalledWith('/api/mall/categories/tree')
    expect(tree[0].name).toBe('数码')
  })

  it('getBrands 命中 GET /api/mall/brands 并传 page/size', async () => {
    httpMocks.get.mockResolvedValueOnce(envelope({ items: [], total: 0, page: 1, size: 200 }))
    await catalogApi.getBrands(1, 200)
    expect(httpMocks.get).toHaveBeenCalledWith('/api/mall/brands', { params: { page: 1, size: 200 } })
  })

  it('getProducts 命中 GET /api/mall/products，brandIds 逗号序列化', async () => {
    httpMocks.get.mockResolvedValueOnce(envelope({ records: [], total: 0, page: 1, size: 20 }))
    await catalogApi.getProducts({ categoryId: '1', brandIds: ['1', '2'], sort: 'price_asc', page: 2 })
    const [url, config] = httpMocks.get.mock.calls[0]
    expect(url).toBe('/api/mall/products')
    expect(config.params.brandIds).toBe('1,2')
    expect(config.params.sort).toBe('price_asc')
    expect(config.params.page).toBe('2')
  })

  it('serializeProductQuery 省略空值字段', () => {
    expect(serializeProductQuery({})).toEqual({})
    expect(serializeProductQuery({ brandIds: [] })).toEqual({})
    expect(serializeProductQuery({ page: 1, size: 20, sort: 'default' })).toEqual({
      page: '1',
      size: '20',
      sort: 'default',
    })
  })
})
