import http from '../http'
import type { ApiResponse } from '@/types'

/**
 * 搜索索引管理 API（M5 CHG-0021 FE-502）。
 *
 * 约定：
 * - 重建任务 / 同步失败记录的主键与商品 ID 均为数值（后端 Long，差集 ID 列表同构）
 * - 时间字段统一为 epoch millis（可空）
 * - 触发重建时若已有 RUNNING 任务，后端返回 409 + code=B0503，由页面捕获提示
 */

/** 重建任务状态（对齐后端 RebuildStatus：PENDING/RUNNING/SUCCESS/FAILED） */
export type RebuildStatus = 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED'

/** 重建任务视图（对齐后端 RebuildTaskView） */
export interface RebuildTaskView {
  id: number
  taskNo: string
  status: RebuildStatus
  totalCount: number
  indexedCount: number
  failedCount: number
  physicalIndex: string | null
  errorMessage: string | null
  startedAt: number | null
  finishedAt: number | null
  createdAt: number
}

/** 索引一致性检查结果 */
export interface ConsistencyCheckView {
  productOnSaleCount: number
  indexCount: number
  /** 在售但索引中缺失的商品 ID */
  missingProductIds: number[]
  /** 索引中存在但已非在售的商品 ID */
  extraProductIds: number[]
  /** 差集结果是否被截断（ID 过多时仅返回前 N 条） */
  missingTruncated: boolean
  extraTruncated: boolean
  checkedAt: number
}

/** 同步失败记录状态（对齐后端 SyncFailureStatus：PENDING/SUCCESS/FAILED_DEAD，无 RETRYING） */
export type SyncFailureStatus = 'PENDING' | 'SUCCESS' | 'FAILED_DEAD'

/** 商品变更同步失败记录（对齐后端 SyncFailureView） */
export interface SyncFailureView {
  id: number
  productId: number
  eventType: string
  status: SyncFailureStatus
  retryCount: number
  maxRetries: number
  lastError: string | null
  nextRetryAt: number | null
  createdAt: number
}

/** items 形态分页视图（区别于品牌域的 records 形态） */
export interface ItemPage<T> {
  total: number
  page: number
  size: number
  items: T[]
}

export interface SyncFailureQuery {
  status?: SyncFailureStatus | ''
  page: number
  size: number
}

function unwrap<T>(response: { data: ApiResponse<T> }): T {
  return response.data.data
}

export const searchIndexApi = {
  /** 触发全量重建：成功 202 返回任务视图；已有 RUNNING 任务时 409（B0503） */
  async rebuild(): Promise<RebuildTaskView> {
    return unwrap(await http.post('/api/admin/search/index/rebuild'))
  },

  /** 最近重建任务列表（默认 20 条） */
  async recentTasks(limit = 20): Promise<RebuildTaskView[]> {
    return unwrap(await http.get('/api/admin/search/index/rebuild', { params: { limit } }))
  },

  /** 查询单个重建任务（轮询用） */
  async getTask(id: number): Promise<RebuildTaskView> {
    return unwrap(await http.get(`/api/admin/search/index/rebuild/${id}`))
  },

  /** 执行索引一致性检查 */
  async consistencyCheck(): Promise<ConsistencyCheckView> {
    return unwrap(await http.get('/api/admin/search/index/consistency-check'))
  },

  /** 分页查询同步失败记录 */
  async syncFailures(query: SyncFailureQuery): Promise<ItemPage<SyncFailureView>> {
    return unwrap(
      await http.get('/api/admin/search/index/sync-failures', {
        params: {
          status: query.status || undefined,
          page: query.page,
          size: query.size,
        },
      }),
    )
  },

  /** 人工重试单条同步失败记录 */
  async retrySyncFailure(id: number): Promise<SyncFailureView> {
    return unwrap(await http.post(`/api/admin/search/index/sync-failures/${id}/retry`))
  },
}
