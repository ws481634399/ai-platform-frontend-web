import axios from 'axios'
import type { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { pinia } from '@/stores'
import { useMemberStore } from '@/stores/member'
import { coordinateRefresh } from '@/utils/refresh-coordinator'

/**
 * 统一 HTTP Client（业务代码唯一 HTTP 出口，禁止直接 import axios）。
 *
 * 契约（对齐后端 UnifyResult：{ success, code, message, data, traceId }）：
 * - 请求注入 Authorization: Bearer（会员 accessToken）与 X-Trace-Id；
 * - 业务请求收到 401 → 单飞 refresh → 重放原请求；refresh 也失败则由协调器集中清会话；
 * - 登录/刷新端点自身的 401 不触发刷新（避免循环）。
 */
const http: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10_000,
})

// ── Request 拦截器 ──────────────────────────────────────────────
http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useMemberStore(pinia).accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  config.headers['X-Trace-Id'] = crypto.randomUUID()
  return config
})

// ── Response 拦截器（统一错误处理入口）──────────────────────────
http.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const request = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined
    const isAuthenticationRequest =
      request?.url?.endsWith('/login') || request?.url?.endsWith('/refresh')
    if (error.response?.status === 401 && request && !request._retry && !isAuthenticationRequest) {
      request._retry = true
      const member = useMemberStore(pinia)
      try {
        await coordinateRefresh(() => member.refresh())
        return http.request(request)
      } catch {
        /* coordinator performs one centralized cleanup */
      }
    }
    return Promise.reject(error)
  },
)

export default http
