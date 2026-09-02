import type { Component } from 'vue'
import { Goods, Monitor, Setting, User } from '@element-plus/icons-vue'

import type { MenuItem } from '@/types'

/** 静态菜单数据（数据与渲染分离；M1 换动态数据源即得动态菜单，渲染层不变） */
export const menuItems: MenuItem[] = [
  { path: '/dashboard', title: '工作台', icon: Monitor },
  { path: '/users', title: '用户管理', icon: User },
  { path: '/products', title: '商品管理', icon: Goods },
  { path: '/settings', title: '系统设置', icon: Setting },
]

export type { Component }
