import { describe, expect, it, vi, beforeEach } from 'vitest'
import { delayTaskApi } from './distributed'

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
}))

vi.mock('./http', () => ({
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

describe('delayTaskApi.page', () => {
  it('默认分页参数，GET 延迟任务列表并解包', async () => {
    mocks.get.mockResolvedValue(ok({ records: [], total: 0, page: 1, size: 20 }))

    const view = await delayTaskApi.page({})

    expect(mocks.get).toHaveBeenCalledTimes(1)
    expect(mocks.get).toHaveBeenCalledWith('/api/admin/order-delay/tasks', {
      params: { page: 1, size: 20 },
    })
    expect(view.page).toBe(1)
  })

  it('透传状态与自定义分页', async () => {
    mocks.get.mockResolvedValue(ok({ records: [], total: 0, page: 3, size: 50 }))

    await delayTaskApi.page({ status: 'FAILED', page: 3, size: 50 })

    expect(mocks.get).toHaveBeenCalledWith('/api/admin/order-delay/tasks', {
      params: { page: 3, size: 50, status: 'FAILED' },
    })
  })
})

describe('delayTaskApi.cancel', () => {
  it('POST 人工取消，携带原因', async () => {
    mocks.post.mockResolvedValue(ok({ orderId: 9, orderNo: 'ON9', delayStatus: 'CANCELLED' }))

    await delayTaskApi.cancel(9, '运营介入')

    expect(mocks.post).toHaveBeenCalledTimes(1)
    expect(mocks.post).toHaveBeenCalledWith(
      '/api/admin/order-delay/tasks/9/cancel',
      { reason: '运营介入' },
    )
  })

  it('原因为空白时发送空对象，不传 null 原因', async () => {
    mocks.post.mockResolvedValue(ok({ orderId: 9, delayStatus: 'CANCELLED' }))

    await delayTaskApi.cancel(9, '   ')

    expect(mocks.post).toHaveBeenCalledWith(
      '/api/admin/order-delay/tasks/9/cancel',
      {},
    )
  })
})
