import { beforeEach, describe, expect, it, vi } from 'vitest'

const httpMocks = vi.hoisted(() => ({
  get: vi.fn(),
}))

vi.mock('@/api/http', () => ({ default: httpMocks }))

import { searchApi, serializeSearchQuery } from './search'

function envelope<T>(data: T) {
  return {
    data: { success: true, code: '0', message: 'ok', traceId: 't', data },
  }
}

describe('商城商品搜索 API（CHG-0020 FE-501）', () => {
  beforeEach(() => vi.clearAllMocks())

  it('products 命中 GET /api/mall/search/products 并解包分页摘要', async () => {
    httpMocks.get.mockResolvedValueOnce(
      envelope({
        items: [
          {
            productId: '1001',
            productName: '机械键盘',
            mainImage: 'a.jpg',
            minPrice: 19900,
            maxPrice: 29900,
            brandName: 'HHKB',
            categoryName: '数码',
          },
        ],
        total: 1,
        page: 1,
        size: 20,
      }),
    )
    const result = await searchApi.products({ keyword: '键盘', sort: 'price_asc', page: 1, size: 20 })

    expect(httpMocks.get).toHaveBeenCalledWith('/api/mall/search/products', {
      params: { keyword: '键盘', sort: 'price_asc', page: '1', size: '20' },
    })
    expect(result.items[0].productId).toBe('1001')
    expect(result.items[0].brandName).toBe('HHKB')
    expect(result.total).toBe(1)
  })

  it('serializeSearchQuery 空参数与默认排序（""）全部省略', () => {
    expect(serializeSearchQuery({})).toEqual({})
    expect(serializeSearchQuery({ keyword: '', sort: '', categoryId: undefined, brandId: undefined })).toEqual({})
  })

  it('serializeSearchQuery 完整参数：ID/价区/分页转字符串，sort 原样传递', () => {
    expect(
      serializeSearchQuery({
        keyword: '手机',
        categoryId: '11',
        brandId: '22',
        minPriceFen: 500000,
        maxPriceFen: 1000000,
        sort: 'newest',
        page: 2,
        size: 20,
      }),
    ).toEqual({
      keyword: '手机',
      categoryId: '11',
      brandId: '22',
      minPriceFen: '500000',
      maxPriceFen: '1000000',
      sort: 'newest',
      page: '2',
      size: '20',
    })
  })

  it('serializeSearchQuery 价格 0 分边界保留（!= null 判定，非真值判定）', () => {
    expect(serializeSearchQuery({ minPriceFen: 0 })).toEqual({ minPriceFen: '0' })
  })

  it('serializeSearchQuery 三种排序值均可透传', () => {
    expect(serializeSearchQuery({ sort: 'price_asc' }).sort).toBe('price_asc')
    expect(serializeSearchQuery({ sort: 'price_desc' }).sort).toBe('price_desc')
    expect(serializeSearchQuery({ sort: 'newest' }).sort).toBe('newest')
  })
})
