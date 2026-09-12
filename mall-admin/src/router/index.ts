import { createRouter, createWebHistory } from 'vue-router'
import { pinia } from '@/stores'
import { useAuthStore } from '@/stores/auth'
import { usePermissionStore } from '@/stores/permission'
import { bootstrapSession } from '@/bootstrap/session'
import { clearSession } from '@/auth/clear-session'
import axios from 'axios'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/403', name: 'forbidden', component: () => import('@/views/ForbiddenView.vue'),
      meta: { title: '无权访问' },
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { title: '登录' },
    },
    {
      path: '/',
      component: () => import('@/layouts/AdminLayout.vue'),
      children: [
        { path: '', redirect: '/dashboard' },
        {
          path: 'dashboard',
          name: 'dashboard',
          component: () => import('@/views/WorkbenchView.vue'),
          meta: { title: '工作台' },
        },
        {
          path: 'users',
          name: 'users',
          component: () => import('@/views/UsersPlaceholderView.vue'),
          meta: { title: '用户管理（占位）' },
        },
        {
          path: 'products',
          name: 'products',
          component: () => import('@/views/ProductsPlaceholderView.vue'),
          meta: { title: '商品管理（占位）' },
        },
        {
          path: 'settings',
          name: 'settings',
          component: () => import('@/views/SettingsPlaceholderView.vue'),
          meta: { title: '系统设置（占位）' },
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFoundView.vue'),
      meta: { title: '页面不存在' },
    },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore(pinia)
  if (to.path === '/login') return auth.isAuthenticated ? '/' : true
  if (!auth.isAuthenticated && !(await auth.restore())) return { path: '/login', query: { redirect: to.fullPath } }
  const permission = usePermissionStore(pinia)
  if (permission.permissionVersion === 0 && to.path !== '/403') {
    try { await bootstrapSession(router) }
    catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        clearSession(); return { path: '/login', query: { redirect: to.fullPath } }
      }
      return false
    }
  }
  const required = to.meta.permission
  if (typeof required === 'string' && !permission.has(required)) return '/403'
  return true
})

export { router }
