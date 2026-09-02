/**
 * 项目级通用类型（M0 仅预留；业务类型从 M1 起按域新增）。
 */
import type { Component } from 'vue'

/** 对齐后端 UnifyResult 契约（CHG-0003 design §2.3） */
export interface ApiResponse<T = unknown> {
  success: boolean
  code: string
  message: string
  data: T
  traceId: string
}

/** 侧栏菜单项（AdminLayout 渲染契约；M1 接动态数据源时保持字段兼容） */
export interface MenuItem {
  path: string
  title: string
  icon: Component
}
