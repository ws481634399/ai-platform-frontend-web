import type { OrderStatus } from '@/api/order/order'

/** CHG-0019 订单管理展示工具：纯函数，无框架依赖。 */

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING_PAYMENT: '待付款',
  PAID: '待发货',
  SHIPPED: '待收货',
  COMPLETED: '已完成',
  CANCELLED: '已取消',
}

export function statusLabel(status: string): string {
  return STATUS_LABELS[status as OrderStatus] ?? status
}

/** Element Plus el-tag 类型（业务语义着色） */
export function statusTagType(status: string): 'warning' | 'primary' | 'success' | 'info' | 'danger' {
  switch (status) {
    case 'PENDING_PAYMENT':
      return 'warning'
    case 'PAID':
      return 'primary'
    case 'SHIPPED':
      return 'primary'
    case 'COMPLETED':
      return 'success'
    case 'CANCELLED':
      return 'info'
    default:
      return 'info'
  }
}

export function fenToYuan(fen: number): string {
  return (fen / 100).toFixed(2)
}

export function formatDateTime(iso: string | null, placeholder = '—'): string {
  if (!iso) return placeholder
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return placeholder
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} `
    + `${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const OPERATION_LABELS: Record<string, string> = {
  CREATE: '创建订单',
  PAY: '支付',
  CANCEL: '取消',
  SHIP: '发货',
  CONFIRM_RECEIPT: '确认收货',
}

export function operationLabel(operation: string): string {
  return OPERATION_LABELS[operation] ?? operation
}

const COMPENSATION_STATUS_LABELS: Record<string, string> = {
  PENDING: '待处理',
  SUCCESS: '已成功',
  FAILED_DEAD: '已失败（人工介入）',
}

export function compensationStatusLabel(status: string): string {
  return COMPENSATION_STATUS_LABELS[status] ?? status
}

const OPERATION_BIZ_LABELS: Record<string, string> = {
  RELEASE_INVENTORY: '释放库存',
  CONFIRM_INVENTORY: '确认扣减库存',
}

export function operationBizLabel(operation: string): string {
  return OPERATION_BIZ_LABELS[operation] ?? operation
}
