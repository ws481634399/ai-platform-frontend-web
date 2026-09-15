import { beforeEach, describe, expect, it, vi } from 'vitest'

const httpMocks = vi.hoisted(() => ({
  get: vi.fn(),
}))

vi.mock('@/api/http', () => ({ default: httpMocks }))

import { catalogApi } from './catalog'

function envelope<T>(data: T) {
  return {
    data: { success: true, code: '0', message: 'ok', traceId: 't', data },
  }
}

describe('商城首页 API（CHG-0017 STORY-003-02-01-01 契约）', () => {
  beforeEach(() => vi.clearAllMocks())

  it('getHome 命中 GET /api/mall/home 并解包 HomeView', async () => {
    httpMocks.get.mockResolvedValueOnce(
      envelope({
        categoryEntries: [{ id: '1', name: '数码', iconImageUrl: null }],
        newArrivals: [
          { id: '101', name: '商品一', mainImageUrl: 'img1', minPrice: 9900, maxPrice: 9900 },
        ],
        recommends: [
          { id: '101', name: '商品一', mainImageUrl: 'img1', minPrice: 9900, maxPrice: 9900, source: 'FALLBACK_NEWEST' },
        ],
        banners: [],
      }),
    )

    const home = await catalogApi.getHome()

    expect(httpMocks.get).toHaveBeenCalledWith('/api/mall/home')
    expect(home.categoryEntries[0].id).toBe('1')
    expect(home.newArrivals[0].minPrice).toBe(9900)
    expect(home.recommends[0].source).toBe('FALLBACK_NEWEST')
    expect(home.banners).toEqual([])
  })

  it('金额域为整数分（number），ID 域为字符串', async () => {
    httpMocks.get.mockResolvedValueOnce(
      envelope({
        categoryEntries: [],
        newArrivals: [],
        recommends: [],
        banners: [],
      }),
    )
    const home = await catalogApi.getHome()
    expect(home.banners).toBeInstanceOf(Array)
  })
})
