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
    // CHG-0015：雪花 ID/parentId 为字符串，根节点 parentId="0"
    const nodes = [
      { id: '1900000000000000001', name: '根', parentId: '0', level: 1, sort: 0, status: 'ENABLED', children: [] },
    ]
    get.mockResolvedValue(respond(nodes))

    const result = await categoryApi.tree()

    expect(get).toHaveBeenCalledWith('/api/admin/categories/tree')
    expect(result).toEqual(nodes)
  })

  it('create() 以 payload POST 并返回新 id', async () => {
    post.mockResolvedValue(respond({ id: '1900000000000000042' }))

    const result = await categoryApi.create({ name: '数码', parentId: '0', sort: 5 })

    expect(post).toHaveBeenCalledWith('/api/admin/categories', {
      name: '数码',
      parentId: '0',
      sort: 5,
    })
    expect(result).toEqual({ id: '1900000000000000042' })
  })

  it('update() 按 id PUT，changeStatus() 提交 status 体', async () => {
    put.mockResolvedValue(respond(null))

    const id = '1900000000000000007'
    await categoryApi.update(id, { name: '改名', parentId: '0', sort: 1 })
    await categoryApi.changeStatus(id, 'DISABLED')

    expect(put).toHaveBeenNthCalledWith(1, `/api/admin/categories/${id}`, {
      name: '改名',
      parentId: '0',
      sort: 1,
    })
    expect(put).toHaveBeenNthCalledWith(2, `/api/admin/categories/${id}/status`, { status: 'DISABLED' })
  })
})
