import http from './http'
import type { ApiResponse } from '@/types'

/**
 * 公开功能开关 API（CHG-0022 FE-504）。
 *
 * 契约：GET /api/mall/public-features 匿名可访问，解包后 data 直接为数组，
 * 元素仅含 { key, enabled }（publicFlag 白名单，不含参数值等元信息）。
 */

/** 公开功能开关视图 */
export interface PublicFeature {
  key: string
  enabled: boolean
}

function unwrap<T>(response: { data: ApiResponse<T> }): T {
  return response.data.data
}

export const featuresApi = {
  /** GET /api/mall/public-features 公开功能开关列表 */
  async getPublicFeatures(): Promise<PublicFeature[]> {
    return unwrap<PublicFeature[]>(await http.get('/api/mall/public-features'))
  },
}
