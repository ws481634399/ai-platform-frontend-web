import { describe, expect, it, vi, beforeEach } from 'vitest'
import { brandApi } from './brand'

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
}))

vi.mock('../http', () => ({
  default: {
    get: mocks.get,
    post: mocks.post,
    put: mocks.put,
  },
}))

function ok<T>(data: T): { data: { code: string; data: T } } {
  return { data: { code: '0', data } }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('brandApi', () => {
  it('page 携带筛选与分页参数并解包 PageView', async () => {
    // CHG-0015：使用超出 JS 安全整数的字符串雪花 ID，验证端到端不丢精度
    const payload = { records: [{ id: '1900000000000000001', name: 'Nike', sort: 0, status: 'ENABLED' }], total: 1, page: 2, size: 10 }
    mocks.get.mockResolvedValueOnce(ok(payload))

    const result = await brandApi.page({ keyword: 'ni', status: 'ENABLED', page: 2, size: 10 })

    expect(mocks.get).toHaveBeenCalledWith('/api/admin/brands', {
      params: { keyword: 'ni', status: 'ENABLED', page: 2, size: 10 },
    })
    expect(result.total).toBe(1)
    expect(result.records[0].name).toBe('Nike')
  })

  it('page 空 keyword/status 时不下发 undefined 条件', async () => {
    mocks.get.mockResolvedValueOnce(ok({ records: [], total: 0, page: 1, size: 20 }))

    await brandApi.page({ keyword: '', status: '', page: 1, size: 20 })

    expect(mocks.get).toHaveBeenCalledWith('/api/admin/brands', {
      params: { keyword: undefined, status: undefined, page: 1, size: 20 },
    })
  })

  it('create 返回新 id；update/changeStatus 走对应端点', async () => {
    const newId = '1900000000000000007'
    mocks.post.mockResolvedValueOnce(ok({ id: newId }))
    mocks.put.mockResolvedValue(ok(null))

    await expect(brandApi.create({ name: 'Puma', sort: 0 })).resolves.toEqual({ id: newId })
    expect(mocks.post).toHaveBeenCalledWith('/api/admin/brands', { name: 'Puma', sort: 0 })

    await brandApi.update(newId, { name: 'Puma2' })
    expect(mocks.put).toHaveBeenNthCalledWith(1, `/api/admin/brands/${newId}`, { name: 'Puma2' })

    await brandApi.changeStatus(newId, 'DISABLED')
    expect(mocks.put).toHaveBeenNthCalledWith(2, `/api/admin/brands/${newId}/status`, { status: 'DISABLED' })
  })
})
