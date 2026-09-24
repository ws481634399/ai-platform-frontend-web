import { describe, expect, it, vi, beforeEach } from 'vitest'
import { compensationApi } from './order'

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
}))

vi.mock('../http', () => ({
  default: {
    get: mocks.get,
    post: mocks.post,
  },
}))

function ok<T>(data: T): { data: { code: string; data: T } } {
  return { data: { code: '0', data } }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('compensationApi.page', () => {
  it('默认分页参数', async () => {
    mocks.get.mockResolvedValue(ok({ records: [], total: 0, page: 1, size: 20 }))

    await compensationApi.page({})

    expect(mocks.get).toHaveBeenCalledWith('/api/admin/compensations', {
      params: { page: 1, size: 20 },
    })
  })

  it('透传操作类型/聚合 ID/状态', async () => {
    mocks.get.mockResolvedValue(ok({ records: [], total: 0, page: 2, size: 50 }))

    await compensationApi.page({
      operation: 'AUTO_CANCEL_ORDER',
      aggregateId: 'ORD2026',
      status: 'PENDING',
      page: 2,
      size: 50,
    })

    expect(mocks.get).toHaveBeenCalledWith('/api/admin/compensations', {
      params: {
        page: 2,
        size: 50,
        operation: 'AUTO_CANCEL_ORDER',
        aggregateId: 'ORD2026',
        status: 'PENDING',
      },
    })
  })
})

describe('compensationApi.complete', () => {
  it('POST 手动标记完成', async () => {
    mocks.post.mockResolvedValue(ok({ id: '77', status: 'SUCCESS' }))

    const view = await compensationApi.complete('77')

    expect(mocks.post).toHaveBeenCalledTimes(1)
    expect(mocks.post).toHaveBeenCalledWith('/api/admin/compensations/77/complete')
    expect(view.status).toBe('SUCCESS')
  })
})
