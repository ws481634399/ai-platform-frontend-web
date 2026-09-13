import 'vue-router'

// 统一页头（PageHeader）使用的路由元信息
export interface BreadcrumbItem {
  title: string
  /** 可点击跳转；缺省为当前页纯文本 */
  to?: import('vue-router').RouteLocationRaw
}

declare module 'vue-router' {
  interface RouteMeta {
    /** 页面标题（浏览器标题/页头当前页） */
    title?: string
    /** 动态路由（后端菜单注册）标记 */
    dynamic?: boolean
    /** 访问所需权限码 */
    permission?: string
    /** 面包屑层级（含当前页，最后一项不可点击） */
    breadcrumb?: BreadcrumbItem[]
    /** 显示返回按钮；fallback 用于无浏览历史时（直接粘贴 URL 进入） */
    back?: { fallback: import('vue-router').RouteLocationRaw }
  }
}
