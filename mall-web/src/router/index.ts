import { createRouter, createWebHistory } from 'vue-router'
import { pinia } from '@/stores'
import { useMemberStore } from '@/stores/member'
import { resolveMemberRouteAccess } from './access-policy'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'member-login',
      component: () => import('@/views/auth/LoginView.vue'),
      meta: { title: '会员登录' },
    },
    {
      path: '/register',
      name: 'member-register',
      component: () => import('@/views/auth/RegisterView.vue'),
      meta: { title: '会员注册' },
    },
    {
      path: '/',
      component: () => import('@/layouts/MallLayout.vue'),
      children: [
        {
          path: '',
          name: 'home',
          component: () => import('@/views/HomeView.vue'),
          meta: { title: '首页' },
        },
        {
          path: 'member/profile',
          name: 'member-profile',
          component: () => import('@/views/member/ProfileView.vue'),
          meta: { title: '个人资料', requiresMember: true },
        },
        {
          path: 'member/addresses',
          name: 'member-addresses',
          component: () => import('@/views/member/AddressListView.vue'),
          meta: { title: '收货地址', requiresMember: true },
        },
        {
          path: 'products',
          name: 'product-list',
          component: () => import('@/views/product/ProductListView.vue'),
          meta: { title: '商品列表' },
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

// 会员登录态守卫：游客页对已登录会员回首页；会员页未登录先试 restore（refresh cookie），
// 仍失败则跳 /login?redirect=原路径（AC-015）。
router.beforeEach(async (to) => {
  const member = useMemberStore(pinia)
  if (to.meta.requiresMember === true && !member.isAuthenticated && !(await member.restore())) {
    return resolveMemberRouteAccess({
      path: to.path,
      fullPath: to.fullPath,
      isAuthenticated: false,
      requiresMember: true,
    })
  }
  return resolveMemberRouteAccess({
    path: to.path,
    fullPath: to.fullPath,
    isAuthenticated: member.isAuthenticated,
    requiresMember: to.meta.requiresMember === true,
  })
})

export { router }
