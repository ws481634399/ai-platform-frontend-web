import axios from 'axios'
import type { AxiosError } from 'axios'
import http from './http'
import type { ApiResponse } from '@/types'

/**
 * 系统配置域 API（M5 CHG-0022 FE-503）：
 * - 功能开关 /api/admin/feature-configs
 * - 系统参数 /api/admin/system-parameters
 * - 配置变更历史 /api/admin/config-history
 *
 * 后端业务错误码：
 * - B0601 400：值非法 / 内置配置不可删
 * - B0602 409：key 冲突
 * - B0603 404：配置不存在
 * - B0604 409：版本冲突（乐观锁，需刷新后重试）
 */

/** items 形态分页视图（配置域统一形态） */
export interface ItemPage<T> {
  total: number
  page: number
  size: number
  items: T[]
}

// ── 功能开关 ───────────────────────────────────────────────────

export interface FeatureConfigItem {
  key: string
  name: string
  group: string
  enabled: boolean
  /** 是否对 C 端公开可见 */
  publicFlag: boolean
  builtIn: boolean
  /** 乐观锁版本号 */
  version: number
  description: string
}

export interface FeatureConfigQuery {
  group?: string
  /** '' 表示不筛选；true/false 原样下发 */
  enabled?: boolean | ''
  page: number
  size: number
}

export interface CreateFeatureConfigPayload {
  key: string
  name: string
  group: string
  enabled: boolean
  publicFlag: boolean
  description: string
}

export interface UpdateFeatureConfigPayload {
  name: string
  group: string
  enabled: boolean
  publicFlag: boolean
  description: string
  version: number
  changeReason: string
}

// ── 系统参数 ───────────────────────────────────────────────────

export type ParameterType = 'STRING' | 'INTEGER' | 'LONG' | 'DECIMAL' | 'BOOLEAN' | 'JSON'
export type ParameterEffectType = 'DYNAMIC' | 'RESTART_REQUIRED'

export interface SystemParameterItem {
  key: string
  name: string
  group: string
  type: ParameterType
  /** 参数值统一以字符串承载（BOOLEAN 为 'true'/'false'，JSON 为序列化串） */
  value: string
  defaultValue: string | null
  minValue: string | null
  maxValue: string | null
  effectType: ParameterEffectType
  publicFlag: boolean
  builtIn: boolean
  version: number
  description: string
}

export interface SystemParameterQuery {
  group?: string
  enabled?: boolean | ''
  page: number
  size: number
}

export interface CreateSystemParameterPayload {
  key: string
  name: string
  group: string
  type: ParameterType
  value: string
  defaultValue?: string
  minValue?: string
  maxValue?: string
  effectType: ParameterEffectType
  publicFlag: boolean
  description: string
}

export interface UpdateSystemParameterPayload {
  name: string
  group: string
  value: string
  defaultValue?: string
  minValue?: string
  maxValue?: string
  effectType: ParameterEffectType
  publicFlag: boolean
  description: string
  version: number
  changeReason: string
}

// ── 配置变更历史 ───────────────────────────────────────────────

export type ConfigType = 'FEATURE' | 'PARAMETER'
export type ConfigChangeKind = 'CREATED' | 'UPDATED' | 'DELETED'

export interface ConfigHistoryItem {
  configType: ConfigType
  configKey: string
  oldValue: string | null
  newValue: string | null
  changeKind: ConfigChangeKind
  changedBy: string
  changeReason: string | null
  traceId: string
  /** epoch millis */
  changedAt: number
}

export interface ConfigHistoryQuery {
  configType?: ConfigType | ''
  key?: string
  page: number
  size: number
}

// ── 错误归一化 ─────────────────────────────────────────────────

/**
 * 统一提取后端错误文案：优先 UnifyResult.message（服务端已带 B0601~B0604 文案），
 * 其次 axios/Error 自身消息，最后使用调用方兜底文案。
 */
export function extractApiErrorMessage(ex: unknown, fallback: string): string {
  if (axios.isAxiosError(ex)) {
    const data = (ex as AxiosError<ApiResponse>).response?.data
    if (data?.message) return data.message
    return ex.message || fallback
  }
  if (ex instanceof Error && ex.message) return ex.message
  return fallback
}

/** 读取后端业务错误码（如 B0604），非 axios 响应错误时返回 null */
export function getApiErrorCode(ex: unknown): string | null {
  if (!axios.isAxiosError(ex)) return null
  return (ex as AxiosError<ApiResponse>).response?.data?.code ?? null
}

/**
 * 配置写操作错误文案：B0604 版本冲突时追加「刷新后重试」引导；
 * 服务端已返回 message 时仍以服务端文案为准。
 */
export function friendlyConfigErrorMessage(ex: unknown, fallback: string): string {
  const message = extractApiErrorMessage(ex, fallback)
  if (getApiErrorCode(ex) === 'B0604') {
    return message.includes('刷新') ? message : `${message}，请刷新后重试`
  }
  if (axios.isAxiosError(ex) && ex.response?.status === 403) {
    return '无权执行该操作（403）'
  }
  return message
}

function unwrap<T>(response: { data: ApiResponse<T> }): T {
  return response.data.data
}

/** 空串筛选归一化为 undefined，避免把空条件下发给后端 */
function optional(value: string | boolean | '' | undefined): string | boolean | undefined {
  if (value === '' || value === undefined) return undefined
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed === '' ? undefined : trimmed
  }
  return value
}

// ── API 定义 ───────────────────────────────────────────────────

export const featureConfigApi = {
  async page(query: FeatureConfigQuery): Promise<ItemPage<FeatureConfigItem>> {
    return unwrap(
      await http.get('/api/admin/feature-configs', {
        params: {
          group: optional(query.group),
          enabled: optional(query.enabled),
          page: query.page,
          size: query.size,
        },
      }),
    )
  },

  async create(payload: CreateFeatureConfigPayload): Promise<FeatureConfigItem> {
    return unwrap(await http.post('/api/admin/feature-configs', payload))
  },

  async update(key: string, payload: UpdateFeatureConfigPayload): Promise<FeatureConfigItem> {
    return unwrap(await http.put(`/api/admin/feature-configs/${encodeURIComponent(key)}`, payload))
  },

  /** 删除功能开关需填写原因（审计留痕，query 透传） */
  async remove(key: string, reason: string): Promise<void> {
    await http.delete(`/api/admin/feature-configs/${encodeURIComponent(key)}`, {
      params: { reason },
    })
  },
}

export const systemParameterApi = {
  async page(query: SystemParameterQuery): Promise<ItemPage<SystemParameterItem>> {
    return unwrap(
      await http.get('/api/admin/system-parameters', {
        params: {
          group: optional(query.group),
          enabled: optional(query.enabled),
          page: query.page,
          size: query.size,
        },
      }),
    )
  },

  async create(payload: CreateSystemParameterPayload): Promise<SystemParameterItem> {
    return unwrap(await http.post('/api/admin/system-parameters', payload))
  },

  async update(key: string, payload: UpdateSystemParameterPayload): Promise<SystemParameterItem> {
    return unwrap(await http.put(`/api/admin/system-parameters/${encodeURIComponent(key)}`, payload))
  },

  async remove(key: string): Promise<void> {
    await http.delete(`/api/admin/system-parameters/${encodeURIComponent(key)}`)
  },
}

export const configHistoryApi = {
  async page(query: ConfigHistoryQuery): Promise<ItemPage<ConfigHistoryItem>> {
    return unwrap(
      await http.get('/api/admin/config-history', {
        params: {
          configType: optional(query.configType),
          key: optional(query.key),
          page: query.page,
          size: query.size,
        },
      }),
    )
  },
}
