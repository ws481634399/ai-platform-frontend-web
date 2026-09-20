import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const aiMocks = vi.hoisted(() => ({
  recommendations: vi.fn(),
}))

vi.mock('@/api/ai', () => ({
  aiApi: aiMocks,
}))

import AssistantView from '@/views/ai/AssistantView.vue'

function fullResponse() {
  return {
    conversationId: 'conv-1',
    message: '为你推荐 1 款',
    recommendations: [
      {
        productId: '1',
        productName: '轻薄本 Pro',
        image: 'http://img.example/1.png',
        price: '5999.00',
        reason: '续航 24 小时，品牌 A',
      },
    ],
    clarifyingQuestion: null,
  }
}

function mountView() {
  return mount(AssistantView, {
    global: {
      config: {
        warnHandler: () => null, // 忽略 scrollIntoView 等环境警告
      },
    },
  })
}

async function send(wrapper: ReturnType<typeof mountView>, text: string) {
  await wrapper.find('[data-testid="assistant-input"]').setValue(text)
  await wrapper.find('[data-testid="assistant-form"]').trigger('submit')
  await flushPromises()
}

describe('AssistantView AI 导购助手', () => {
  beforeEach(() => vi.clearAllMocks())

  it('推荐成功：渲染助手气泡 + 商品卡片（真实价/理由/"价格以结算页为准"）', async () => {
    aiMocks.recommendations.mockResolvedValueOnce(fullResponse())
    const wrapper = mountView()
    await send(wrapper, '6000 以内轻薄本')

    expect(aiMocks.recommendations).toHaveBeenCalledWith({ conversationId: undefined, message: '6000 以内轻薄本' })
    expect(wrapper.find('[data-testid="assistant-recommendations"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="recommendation-1"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('轻薄本 Pro')
    expect(wrapper.text()).toContain('￥5999.00')
    expect(wrapper.text()).toContain('价格以结算页为准')
  })

  it('澄清态：返回 clarifyingQuestion 时只出追问气泡，不出卡片', async () => {
    aiMocks.recommendations.mockResolvedValueOnce({
      conversationId: 'conv-2',
      message: null,
      recommendations: [],
      clarifyingQuestion: '您的预算大概多少？主要用来办公还是游戏？',
    })
    const wrapper = mountView()
    await send(wrapper, '推荐个笔记本')

    expect(wrapper.find('[data-testid="assistant-recommendations"]').exists()).toBe(false)
    expect(wrapper.findAll('[data-testid="bubble-assistant"]').length).toBe(1)
    expect(wrapper.text()).toContain('预算大概多少')
  })

  it('多轮会话：第二轮透传上一轮返回的 conversationId', async () => {
    aiMocks.recommendations
      .mockResolvedValueOnce(fullResponse())
      .mockResolvedValueOnce({
        conversationId: 'conv-1',
        message: '这是第二款',
        recommendations: [],
        clarifyingQuestion: null,
      })
    const wrapper = mountView()
    await send(wrapper, '预算 7000 内笔记本推荐')
    await send(wrapper, '第二台再详细说说')

    expect(aiMocks.recommendations).toHaveBeenLastCalledWith({ conversationId: 'conv-1', message: '第二台再详细说说' })
  })

  it('403 开关关闭：渲染"暂未开启"空态', async () => {
    const error = Object.assign(new Error('forbidden'), { response: { status: 403 } })
    aiMocks.recommendations.mockRejectedValueOnce(error)
    const wrapper = mountView()
    await send(wrapper, '推荐个笔记本')

    expect(wrapper.find('[data-testid="state-disabled"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('AI 导购暂未开启')
  })

  it('5xx：渲染错误文案 + 重试按钮，重试复用上一条消息', async () => {
    const error = Object.assign(new Error('bad gateway'), { response: { status: 502 } })
    aiMocks.recommendations.mockRejectedValueOnce(error)
    const wrapper = mountView()
    await send(wrapper, '推荐个笔记本')

    expect(wrapper.find('[data-testid="state-error"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="state-disabled"]').exists()).toBe(false)

    aiMocks.recommendations.mockResolvedValueOnce(fullResponse())
    await wrapper.find('[data-testid="state-retry"]').trigger('click')
    await flushPromises()
    expect(aiMocks.recommendations).toHaveBeenLastCalledWith({ conversationId: undefined, message: '推荐个笔记本' })
    expect(wrapper.find('[data-testid="state-error"]').exists()).toBe(false)
  })

  it('loading 期间：输入与发送禁用，不重复提交', async () => {
    aiMocks.recommendations.mockImplementationOnce(() => new Promise(() => {})) // 挂起
    const wrapper = mountView()
    await wrapper.find('[data-testid="assistant-input"]').setValue('挂起中的请求')
    await wrapper.find('[data-testid="assistant-form"]').trigger('submit')
    await flushPromises()

    expect(wrapper.find('[data-testid="assistant-loading"]').exists()).toBe(true)
    expect((wrapper.find('[data-testid="assistant-send"]').element as HTMLButtonElement).disabled).toBe(true)
    expect((wrapper.find('[data-testid="assistant-input"]').element as HTMLInputElement).disabled).toBe(true)
    expect(aiMocks.recommendations).toHaveBeenCalledTimes(1)
  })
})
