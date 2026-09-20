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
        {
          path: 'search',
          name: 'search',
          component: () => import('@/views/search/SearchView.vue'),
          meta: { title: '商品搜索' },
        },
        {
          // CHG-0024：AI 导购助手（GUEST 可用，开关显隐在 MallLayout，直达路由渲染空态）
          path: 'ai/assistant',
          name: 'ai-assistant',
          component: () => import('@/views/ai/AssistantView.vue'),
          meta: { title: 'AI 导购助手' },
        },
        {
          // CHG-0024：AI 商品对比（GUEST 可用，开关显隐在 MallLayout，直达路由渲染空态）
          path: 'ai/compare',
          name: 'ai-compare',
          component: () => import('@/views/ai/CompareView.vue'),
          meta: { title: 'AI 商品对比' },
        },
        {
          // CHG-0024：AI 订单助手（强制 MEMBER：守卫 + 后端 401 双保险）
          path: 'ai/orders',
          name: 'ai-orders',
          component: () => import('@/views/ai/OrderAssistantView.vue'),
          meta: { title: 'AI 订单助手', requiresMember: true },
        },
        {
          // CHG-0024：RAG 智能客服（GUEST 可用，开关显隐在 MallLayout，直达路由渲染空态）
          path: 'ai/support',
          name: 'ai-support',
          component: () => import('@/views/ai/SupportView.vue'),
          meta: { title: '智能客服' },
        },
        {
          path: 'products/:id',
          name: 'product-detail',
          component: () => import('@/views/product/ProductDetailView.vue'),
          meta: { title: '商品详情' },
        },
        {
          path: 'cart',
          name: 'cart',
          component: () => import('@/views/cart/CartView.vue'),
          meta: { title: '购物车' },
        },
        {
          path: 'checkout',
          name: 'checkout',
          component: () => import('@/views/checkout/CheckoutView.vue'),
          meta: { title: '确认订单', requiresMember: true },
        },
        {
          path: 'orders',
          name: 'order-list',
          component: () => import('@/views/order/OrderListView.vue'),
          meta: { title: '我的订单', requiresMember: true },
        },
        {
          path: 'orders/:orderNo',
          name: 'order-detail',
          component: () => import('@/views/order/OrderDetailView.vue'),
          meta: { title: '订单详情', requiresMember: true },
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
