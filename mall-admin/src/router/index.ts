import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
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

// 权限守卫扩展入口（M1+ 在此填充 RBAC/动态菜单守卫；默认放行）
router.beforeEach(() => true)

export { router }
