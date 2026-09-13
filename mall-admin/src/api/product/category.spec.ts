import { beforeEach, describe, expect, it, vi } from 'vitest'

import { categoryApi } from './category'

const { get, post, put } = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
}))

vi.mock('../http', () => ({
  default: { get, post, put },
}))

/** 构造 UnifyResult 形态响应 */
function respond<T>(data: T) {
  return { data: { success: true, code: '0', message: '成功', data, traceId: 't1' } }
}

describe('categoryApi（CHG-0010 / DU-FE-301）', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('tree() 调用 /tree 并解包为节点数组', async () => {
    const nodes = [
      { id: 1, name: '根', parentId: 0, level: 1, sort: 0, status: 'ENABLED', children: [] },
    ]
    get.mockResolvedValue(respond(nodes))

    const result = await categoryApi.tree()

    expect(get).toHaveBeenCalledWith('/api/admin/categories/tree')
    expect(result).toEqual(nodes)
  })

  it('create() 以 payload POST 并返回新 id', async () => {
    post.mockResolvedValue(respond({ id: 42 }))

    const result = await categoryApi.create({ name: '数码', parentId: 0, sort: 5 })

    expect(post).toHaveBeenCalledWith('/api/admin/categories', {
      name: '数码',
      parentId: 0,
      sort: 5,
    })
    expect(result).toEqual({ id: 42 })
  })

  it('update() 按 id PUT，changeStatus() 提交 status 体', async () => {
    put.mockResolvedValue(respond(null))

    await categoryApi.update(7, { name: '改名', parentId: 0, sort: 1 })
    await categoryApi.changeStatus(7, 'DISABLED')

    expect(put).toHaveBeenNthCalledWith(1, '/api/admin/categories/7', {
      name: '改名',
      parentId: 0,
      sort: 1,
    })
    expect(put).toHaveBeenNthCalledWith(2, '/api/admin/categories/7/status', { status: 'DISABLED' })
  })
})
