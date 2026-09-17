/**
 * 订单展示工具（CHG-0019）。
 *
 * 纯函数，便于单测；状态语义 SSOT 为后端 OrderStatus，前端仅做体验层映射，
 * 真正的操作合法性始终以后端校验为准。
 */
import type { OrderStatus, PreviewStockStatus } from '@/types/order'

/** 状态 → 中文文案 */
const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING_PAYMENT: '待付款',
  PAID: '待发货',
  SHIPPED: '待收货',
  COMPLETED: '已完成',
  CANCELLED: '已取消',
}

/** 会员订单列表筛选项（value 为空串表示全部） */
export const ORDER_STATUS_FILTERS: Array<{ value: '' | OrderStatus; label: string }> = [
  { value: '', label: '全部' },
  { value: 'PENDING_PAYMENT', label: '待付款' },
  { value: 'PAID', label: '待发货' },
  { value: 'SHIPPED', label: '待收货' },
  { value: 'COMPLETED', label: '已完成' },
  { value: 'CANCELLED', label: '已取消' },
]

export function orderStatusLabel(status: string): string {
  return ORDER_STATUS_LABELS[status as OrderStatus] ?? status
}

const STOCK_STATUS_LABELS: Record<PreviewStockStatus, string> = {
  OK: '现货充足',
  LOW: '库存紧张',
  OUT_OF_STOCK: '已售罄',
}

export function stockStatusLabel(status: string): string {
  return STOCK_STATUS_LABELS[status as PreviewStockStatus] ?? status
}

/** 预览行问题码 → 中文文案（issueCodes 由后端签发） */
const ISSUE_LABELS: Record<string, string> = {
  SKU_NOT_SALABLE: '商品已下架或不可售',
  OUT_OF_STOCK: '库存不足',
  STOCK_INSUFFICIENT: '库存不足',
}

export function issueLabel(code: string): string {
  return ISSUE_LABELS[code] ?? code
}

/** 仅待付款订单展示「支付 / 取消」（后端为最终守门） */
export function canPay(status: OrderStatus): boolean {
  return status === 'PENDING_PAYMENT'
}

export const canCancel = canPay

/** 仅已发货订单展示「确认收货」 */
export function canConfirmReceipt(status: OrderStatus): boolean {
  return status === 'SHIPPED'
}

/** 整数分 → 元字符串（保留两位小数） */
export function fenToYuan(fen: number): string {
  return (fen / 100).toFixed(2)
}

/** ISO-8601 时间 → 本地展示串；空值返回占位符 */
export function formatDateTime(iso: string | null, placeholder = '—'): string {
  if (!iso) return placeholder
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return placeholder
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} `
    + `${pad(date.getHours())}:${pad(date.getMinutes())}`
}
