import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createRouter, createWebHistory } from 'vue-router'

const aiMocks = vi.hoisted(() => ({
  ordersAssistant: vi.fn(),
  ordersConfirm: vi.fn(),
}))

vi.mock('@/api/ai', () => ({
  aiApi: aiMocks,
}))

import OrderAssistantView from '@/views/ai/OrderAssistantView.vue'

function queryResponse() {
  return {
    conversationId: 'conv-o1',
    message: '为你找到 1 笔待支付订单：',
    orders: [
      {
        orderNo: '20260920001',
        status: 'PENDING_PAYMENT',
        statusText: '待支付',
        productName: '轻薄本 Pro',
        totalAmount: '5999.00',
        createdAt: '2026-09-20 10:00:00',
      },
    ],
    pendingAction: null,
  }
}

function cancelProposeResponse() {
  return {
    conversationId: 'conv-o1',
    message: '好的，需要你确认后我再取消：',
    orders: [
      {
        orderNo: '20260920001',
        status: 'PENDING_PAYMENT',
        statusText: '待支付',
        productName: '轻薄本 Pro',
        totalAmount: '5999.00',
        createdAt: '2026-09-20 10:00:00',
      },
    ],
    pendingAction: {
      actionId: 'act-abc12345',
      type: 'cancel_order',
      orderNo: '20260920001',
      orderStatus: 'PENDING_PAYMENT',
      summary: '确认取消订单 20260920001 吗？',
    },
  }
}

function mountView() {
  const testRouter = createRouter({
    history: createWebHistory(),
    routes: [{ path: '/login', component: { template: '<div />' } }],
  })
  return mount(OrderAssistantView, {
    global: {
      plugins: [testRouter],
      config: {
        warnHandler: () => null,
      },
    },
  })
}

async function ask(wrapper: ReturnType<typeof mountView>, text: string) {
  await wrapper.find('[data-testid="orders-ai-input"]').setValue(text)
  await wrapper.find('[data-testid="orders-ai-form"]').trigger('submit')
  await flushPromises()
}

describe('OrderAssistantView AI 订单助手', () => {
  beforeEach(() => vi.clearAllMocks())

  it('查询成功：渲染订单卡片（订单号/状态文案/金额/商品摘要），多轮透传 conversationId', async () => {
    aiMocks.ordersAssistant.mockResolvedValueOnce(queryResponse())
    const wrapper = mountView()

    await ask(wrapper, '我的待支付订单')
    expect(aiMocks.ordersAssistant).toHaveBeenCalledWith({
      conversationId: undefined,
      message: '我的待支付订单',
    })

    const card = wrapper.find('[data-testid="order-card-20260920001"]')
    expect(card.exists()).toBe(true)
    expect(card.find('[data-testid="order-no"]').text()).toContain('20260920001')
    expect(card.find('[data-testid="order-status"]').text()).toBe('待支付')
    expect(card.find('[data-testid="order-amount"]').text()).toBe('￥5999.00')
    expect(card.find('[data-testid="order-product"]').text()).toContain('轻薄本 Pro')

    await ask(wrapper, '再看看别的')
    expect(aiMocks.ordersAssistant).toHaveBeenLastCalledWith({
      conversationId: 'conv-o1',
      message: '再看看别的',
    })
  })

  it('确认流：pendingAction 出弹窗 → 确认调 /confirm（confirm:true），卡片状态刷新为已取消', async () => {
    aiMocks.ordersAssistant.mockResolvedValueOnce(cancelProposeResponse())
    aiMocks.ordersConfirm.mockResolvedValueOnce({
      conversationId: 'conv-o1',
      message: '订单已取消',
      order: {
        orderNo: '20260920001',
        status: 'CANCELLED',
        statusText: '已取消',
        productName: '轻薄本 Pro',
        totalAmount: '5999.00',
        createdAt: '2026-09-20 10:00:00',
      },
    })
    const wrapper = mountView()
    await ask(wrapper, '帮我取消这笔订单')

    const dialog = wrapper.find('[data-testid="orders-confirm-dialog"]')
    expect(dialog.exists()).toBe(true)
    expect(dialog.text()).toContain('20260920001')
    expect(aiMocks.ordersConfirm).not.toHaveBeenCalled()

    await wrapper.find('[data-testid="orders-confirm-ok"]').trigger('click')
    await flushPromises()
    expect(aiMocks.ordersConfirm).toHaveBeenCalledWith({
      conversationId: 'conv-o1',
      actionId: 'act-abc12345',
      confirm: true,
    })
    expect(wrapper.find('[data-testid="orders-confirm-dialog"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="order-status"]').text()).toBe('已取消')
    expect(wrapper.find('[data-testid="orders-confirm-result"]').text()).toContain('订单已取消')
  })

  it('弹窗点"再想想"：关闭弹窗且不调用 /confirm（无写副作用）', async () => {
    aiMocks.ordersAssistant.mockResolvedValueOnce(cancelProposeResponse())
    const wrapper = mountView()
    await ask(wrapper, '取消订单')

    await wrapper.find('[data-testid="orders-confirm-cancel"]').trigger('click')
    await flushPromises()
    expect(wrapper.find('[data-testid="orders-confirm-dialog"]').exists()).toBe(false)
    expect(aiMocks.ordersConfirm).not.toHaveBeenCalled()
  })

  it('401：渲染登录引导，按钮跳登录页并带回跳地址', async () => {
    const error = Object.assign(new Error('unauthorized'), { response: { status: 401 } })
    aiMocks.ordersAssistant.mockRejectedValueOnce(error)
    const wrapper = mountView()
    await ask(wrapper, '我的订单')

    expect(wrapper.find('[data-testid="state-unauthorized"]').exists()).toBe(true)
    await wrapper.find('[data-testid="orders-login-button"]').trigger('click')
    await flushPromises()
    // 跳登录页并带回跳地址
    expect(window.location.pathname).toBe('/login')
    expect(window.location.search).toContain('redirect=/ai/orders')
  })

  it('409：后端拒绝消息透出（actionId 已消费/状态不允许），不重复发起写操作', async () => {
    const error = Object.assign(new Error('conflict'), {
      response: { status: 409, data: { message: '订单状态已变化，无法取消' } },
    })
    aiMocks.ordersAssistant.mockRejectedValueOnce(error)
    const wrapper = mountView()
    await ask(wrapper, '取消订单')

    expect(wrapper.find('[data-testid="bubble-assistant"]').text()).toContain('订单状态已变化')
    expect(wrapper.find('[data-testid="state-error"]').exists()).toBe(true)
    expect(aiMocks.ordersConfirm).not.toHaveBeenCalled()
  })

  it('403 开关关闭：渲染"AI 订单助手暂未开启"空态', async () => {
    const error = Object.assign(new Error('forbidden'), { response: { status: 403 } })
    aiMocks.ordersAssistant.mockRejectedValueOnce(error)
    const wrapper = mountView()
    await ask(wrapper, '我的订单')

    expect(wrapper.find('[data-testid="state-disabled"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('AI 订单助手暂未开启')
  })

  it('loading 期间输入与发送禁用，不重复提交', async () => {
    aiMocks.ordersAssistant.mockImplementationOnce(() => new Promise(() => {}))
    const wrapper = mountView()
    await wrapper.find('[data-testid="orders-ai-input"]').setValue('挂起中')
    await wrapper.find('[data-testid="orders-ai-form"]').trigger('submit')
    await flushPromises()

    expect(wrapper.find('[data-testid="orders-ai-loading"]').exists()).toBe(true)
    expect((wrapper.find('[data-testid="orders-ai-send"]').element as HTMLButtonElement).disabled).toBe(true)
    expect((wrapper.find('[data-testid="orders-ai-input"]').element as HTMLInputElement).disabled).toBe(true)
    expect(aiMocks.ordersAssistant).toHaveBeenCalledTimes(1)
  })
})
