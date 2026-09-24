import type { DelayTaskStatus } from '@/api/distributed'

/**
 * 延迟取消任务状态展示映射（STORY-009-04-01）：
 * PENDING=待取消(warning) / CANCELLED=已取消(success) / FAILED=失败(danger)。
 */
export function delayStatusTagType(s: DelayTaskStatus): 'warning' | 'success' | 'danger' {
  if (s === 'CANCELLED') return 'success'
  if (s === 'FAILED') return 'danger'
  return 'warning'
}

export function delayStatusLabel(s: DelayTaskStatus): string {
  return { PENDING: '待取消', CANCELLED: '已取消', FAILED: '失败' }[s]
}
