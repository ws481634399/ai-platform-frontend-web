import http from './http'
import type { ApiResponse } from '@/types'
import type { LoginRequest, TokenPair } from '@/types/auth'

function unwrap<T>(response: { data: ApiResponse<T> }): T { return response.data.data }

export const authApi = {
  async login(request: LoginRequest) { return unwrap<TokenPair>(await http.post('/api/admin/auth/login', request)) },
  async refresh() { return unwrap<TokenPair>(await http.post('/api/admin/auth/refresh', undefined, { withCredentials: true })) },
  async logout() { await http.post('/api/admin/auth/logout', undefined, { withCredentials: true }) },
}
