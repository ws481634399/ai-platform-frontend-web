import axios from 'axios'
import type { ApiResponse } from '@/types'

/**
 * 从 axios 错误中透传后端 UnifyResult.message（如「用户名或密码错误」「账号已禁用」）；
 * 非业务响应（网络错误/无 body）时回退到 fallback 文案。
 */
export function resolveErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiResponse | undefined
    if (data?.message) return data.message
  }
  return fallback
}
