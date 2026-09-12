import axios from 'axios'
import type { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { pinia } from '@/stores'
import { useAuthStore } from '@/stores/auth'
import { coordinateRefresh } from './refresh-coordinator'

/**
 * 统一 HTTP Client（业务代码唯一 HTTP 出口，禁止直接 import axios）。
 *
 * 预留契约（对齐后端 CHG-0003 §2.3）：
 * - 响应结构 UnifyResult：{ success, code, message, data, traceId }
 * - TraceId header：X-Trace-Id
 */
const http: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10_000,
})

// ── Request 拦截器 ──────────────────────────────────────────────
// M0 仅透传；M1 在此填充扩展头（Authorization / X-Trace-Id 注入锚点）
http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore(pinia).accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  config.headers['X-Trace-Id'] = crypto.randomUUID()
  return config
})

// ── Response 拦截器（统一错误处理入口）──────────────────────────
// M0：错误进入统一日志后透传；M1 在此填充 401/403/业务错误码处理（M0 不实现 Token 刷新）
http.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const request = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined
    if (error.response?.status === 401 && request && !request._retry && !request.url?.endsWith('/refresh')) {
      request._retry = true
      const auth = useAuthStore(pinia)
      try {
        await coordinateRefresh(() => auth.refresh())
        return http.request(request)
      } catch { /* coordinator performs one centralized cleanup */ }
    }
    return Promise.reject(error)
  },
)

export default http
