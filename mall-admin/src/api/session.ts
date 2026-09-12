import http from './http'
import type { ApiResponse } from '@/types'
import type { BootstrapResponse } from '@/types/auth'

export async function loadAdminSession(): Promise<BootstrapResponse> {
  const response = await http.get<ApiResponse<BootstrapResponse>>('/api/admin/session/bootstrap')
  return response.data.data
}
