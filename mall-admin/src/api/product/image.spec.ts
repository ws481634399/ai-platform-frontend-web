import { describe, expect, it, vi, beforeEach } from 'vitest'
import { uploadProductImage } from './image'

const mocks = vi.hoisted(() => ({
  post: vi.fn(),
}))

vi.mock('../http', () => ({
  default: {
    post: mocks.post,
  },
}))

function ok<T>(data: T): { data: { code: string; data: T } } {
  return { data: { code: '0', data } }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('uploadProductImage', () => {
  it('以 multipart/form-data 提交 file 与 scene=BRAND，并解包 {url}', async () => {
    const file = new File(['图片二进制内容'], 'logo.JPG', { type: 'image/jpeg' })
    mocks.post.mockResolvedValueOnce(ok({ url: 'http://minio/buckets/brand/logo.jpg' }))

    const result = await uploadProductImage('BRAND', file)

    expect(mocks.post).toHaveBeenCalledTimes(1)
    const [url, formData] = mocks.post.mock.calls[0]
    expect(url).toBe('/api/admin/product-images')
    expect(formData).toBeInstanceOf(FormData)
    expect(formData.get('scene')).toBe('BRAND')
    // append 进 FormData 的 File 会以 File 对象形式取回
    const uploaded = formData.get('file')
    expect(uploaded).toBeInstanceOf(File)
    expect((uploaded as File).name).toBe('logo.JPG')
    expect(result).toEqual({ url: 'http://minio/buckets/brand/logo.jpg' })
  })

  it('PRODUCT 场景同样携带正确的 scene 字段与文件 part', async () => {
    const file = new File(['商品图'], 'p.webp', { type: 'image/webp' })
    mocks.post.mockResolvedValueOnce(ok({ url: 'http://minio/buckets/product/p.webp' }))

    const result = await uploadProductImage('PRODUCT', file)

    const [, formData] = mocks.post.mock.calls[0]
    expect(formData.get('scene')).toBe('PRODUCT')
    expect(formData.get('file')).toBeInstanceOf(File)
    expect(result.url).toBe('http://minio/buckets/product/p.webp')
  })
})
