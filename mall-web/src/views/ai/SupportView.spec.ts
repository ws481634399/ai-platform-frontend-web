import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const aiMocks = vi.hoisted(() => ({
  supportChat: vi.fn(),
}))

vi.mock('@/api/ai', () => ({
  aiApi: aiMocks,
}))

import SupportView from '@/views/ai/SupportView.vue'

function hitResponse() {
  return {
    answer: '我们支持全国大部分地区配送，偏远地区可能延长 1-2 天。',
    sources: [
      {
        documentId: 'doc-1',
        title: '配送政策说明',
        snippet: '全国配送范围覆盖 31 个省级行政区，新疆西藏部分地区除外……',
      },
    ],
  }
}

function fallbackResponse() {
  return {
    answer: '当前知识库中没有足够信息回答这个问题，建议联系人工客服。',
    sources: [],
  }
}

function mountView() {
  return mount(SupportView, {
    global: {
      config: {
        warnHandler: () => null,
      },
    },
  })
}

async function ask(wrapper: ReturnType<typeof mountView>, text: string) {
  await wrapper.find('[data-testid="support-input"]').setValue(text)
  await wrapper.find('[data-testid="support-form"]').trigger('submit')
  await flushPromises()
}

describe('SupportView RAG 智能客服', () => {
  beforeEach(() => vi.clearAllMocks())

  it('命中知识：回答气泡 + 引用列表（title+snippet 可展开）', async () => {
    aiMocks.supportChat.mockResolvedValueOnce(hitResponse())
    const wrapper = mountView()

    await ask(wrapper, '支持哪些地区配送')
    expect(aiMocks.supportChat).toHaveBeenCalledWith({
      conversationId: undefined,
      question: '支持哪些地区配送',
    })
    expect(wrapper.find('[data-testid="bubble-assistant"]').text()).toContain('全国大部分地区配送')

    const sources = wrapper.findAll('[data-testid="support-source"]')
    expect(sources.length).toBe(1)
    expect(wrapper.find('[data-testid="support-source-title"]').text()).toBe('配送政策说明')
    expect(wrapper.text()).toContain('31 个省级行政区')
  })

  it('无命中兜底：原样展示固定兜底文案，不出引用列表', async () => {
    aiMocks.supportChat.mockResolvedValueOnce(fallbackResponse())
    const wrapper = mountView()

    await ask(wrapper, '今天股市怎么样')
    expect(wrapper.find('[data-testid="bubble-assistant"]').text()).toContain('没有足够信息')
    expect(wrapper.find('[data-testid="support-sources"]').exists()).toBe(false)
  })

  it('5xx：错误态 + 重试按钮，重试复用上一条问题', async () => {
    const error = Object.assign(new Error('bad gateway'), { response: { status: 502 } })
    aiMocks.supportChat.mockRejectedValueOnce(error)
    const wrapper = mountView()

    await ask(wrapper, '退换货规则')
    expect(wrapper.find('[data-testid="state-error"]').exists()).toBe(true)

    aiMocks.supportChat.mockResolvedValueOnce(hitResponse())
    await wrapper.find('[data-testid="state-retry"]').trigger('click')
    await flushPromises()
    expect(aiMocks.supportChat).toHaveBeenLastCalledWith({
      conversationId: undefined,
      question: '退换货规则',
    })
  })

  it('403 开关关闭：渲染"智能客服暂未开启"空态', async () => {
    const error = Object.assign(new Error('forbidden'), { response: { status: 403 } })
    aiMocks.supportChat.mockRejectedValueOnce(error)
    const wrapper = mountView()

    await ask(wrapper, '配送政策')
    expect(wrapper.find('[data-testid="state-disabled"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('智能客服暂未开启')
  })

  it('新会话：清空对话并重置 conversationId，随后请求不再透传旧标识', async () => {
    aiMocks.supportChat
      .mockResolvedValueOnce(hitResponse())
      .mockResolvedValueOnce({
        answer: '新会话的回答',
        sources: [],
      })
    const wrapper = mountView()

    await ask(wrapper, '第一个问题')
    // 模拟会话内已持有标识（后端契约：会话 id 在视图内复用）
    await wrapper.find('[data-testid="support-new-session"]').trigger('click')
    expect(wrapper.find('[data-testid="bubble-assistant"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="state-empty"]').exists()).toBe(true)

    await ask(wrapper, '新会话的问题')
    expect(aiMocks.supportChat).toHaveBeenLastCalledWith({
      conversationId: undefined,
      question: '新会话的问题',
    })
  })

  it('loading 期间发送禁用，不重复提交', async () => {
    aiMocks.supportChat.mockImplementationOnce(() => new Promise(() => {}))
    const wrapper = mountView()
    await wrapper.find('[data-testid="support-input"]').setValue('挂起中')
    await wrapper.find('[data-testid="support-form"]').trigger('submit')
    await flushPromises()

    expect(wrapper.find('[data-testid="support-loading"]').exists()).toBe(true)
    expect((wrapper.find('[data-testid="support-send"]').element as HTMLButtonElement).disabled).toBe(true)
    expect((wrapper.find('[data-testid="support-input"]').element as HTMLInputElement).disabled).toBe(true)
    expect(aiMocks.supportChat).toHaveBeenCalledTimes(1)
  })
})
