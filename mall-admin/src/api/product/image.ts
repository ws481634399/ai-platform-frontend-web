import http from '../http'
import type { ApiResponse } from '@/types'

/** 图片上传业务场景（CHG-0023 STORY-007-01-01-02，DU-FE-704） */
export type ProductImageScene = 'BRAND' | 'PRODUCT'

/** 上传成功响应：后端返回可访问的图片地址 */
export interface ProductImageUploadResult {
  url: string
}

function unwrap<T>(response: { data: ApiResponse<T> }): T {
  return response.data.data
}

/**
 * 上传商品/品牌图片。
 *
 * 冻结契约：POST /api/admin/product-images，multipart/form-data，
 * part 名 file（图片二进制）+ 表单字段 scene（BRAND/PRODUCT），UnifyResult 包裹 data={url}。
 * 不手动设置 Content-Type，交由浏览器自动补 multipart boundary。
 */
export async function uploadProductImage(
  scene: ProductImageScene,
  file: File,
): Promise<ProductImageUploadResult> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('scene', scene)
  return unwrap(await http.post('/api/admin/product-images', formData))
}

export const imageApi = {
  uploadProductImage,
}
