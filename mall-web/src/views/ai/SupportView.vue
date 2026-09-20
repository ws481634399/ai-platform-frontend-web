<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { aiApi, type AiSupportSource } from '@/api/ai'

/**
 * RAG 智能客服（CHG-0024 DU-FE-003）。
 *
 * 交互状态机（story-design §1/§4）：
 * - 提问 → 回答气泡 + 引用列表（title+snippet 可展开）；
 * - 无可靠知识（sources=[]）→ 原样展示后端固定兜底文案，不编造；
 * - "我的订单"类问题由后端客服边界收口，页面固定引导使用 AI 订单助手；
 * - 403（开关关闭）→ 空态；5xx/网络 → Error 态可重试；新会话按钮重置 conversationId。
 */

interface AnswerEntry {
  role: 'user' | 'assistant'
  text: string
  /** 仅 assistant 回答携带引用来源 */
  sources?: AiSupportSource[]
}

const messages = ref<AnswerEntry[]>([])
const draft = ref('')
const loading = ref(false)
const errorState = ref(false)
const disabledState = ref(false)
const conversationId = ref<string | undefined>(undefined)
const lastSent = ref('')
const listEl = ref<HTMLElement | null>(null)

const canSend = computed(() => !loading.value && draft.value.trim().length > 0)

async function scrollToBottom(): Promise<void> {
  await nextTick()
  listEl.value?.scrollTo({ top: listEl.value.scrollHeight, behavior: 'smooth' })
}

function extractMessage(error: unknown, fallback: string): string {
  const status = (error as { response?: { status?: number } })?.response?.status
  if (status === 400) return '问题似乎不太对，请换个说法再试试。'
  return fallback
}

async function send(): Promise<void> {
  const text = draft.value.trim()
  if (!text || loading.value) return
  lastSent.value = text
  messages.value.push({ role: 'user', text })
  draft.value = ''
  loading.value = true
  errorState.value = false
  await scrollToBottom()
  try {
    const res = await aiApi.supportChat({ conversationId: conversationId.value, question: text })
    // conversationId 由后端经会话服务维护：响应未回传时沿用会话内标识
    messages.value.push({ role: 'assistant', text: res.answer, sources: res.sources })
  } catch (error: unknown) {
    const status = (error as { response?: { status?: number } })?.response?.status
    if (status === 403) {
      disabledState.value = true
    } else {
      errorState.value = true
      messages.value.push({
        role: 'assistant',
        text: extractMessage(error, 'AI 客服暂时繁忙，请稍后重试。'),
      })
    }
  } finally {
    loading.value = false
    await scrollToBottom()
  }
}

function retry(): void {
  draft.value = lastSent.value
  void send()
}

/** 新会话：清空对话与上下文标识，后端会话自然过期 */
function resetSession(): void {
  if (loading.value) return
  messages.value = []
  conversationId.value = undefined
  errorState.value = false
  draft.value = ''
}
</script>

<template>
  <section class="support">
    <header class="support__header">
      <h1 class="support__title">智能客服</h1>
      <p class="support__subtitle">售后政策、常见问题，随时问我</p>
    </header>

    <!-- 开关关闭空态（后端 fail-closed 403） -->
    <div
      v-if="disabledState"
      class="support__state"
      data-testid="state-disabled"
    >
      <p>智能客服暂未开启，敬请期待。</p>
    </div>

    <template v-else>
      <!-- 对话区 -->
      <div
        ref="listEl"
        class="support__list"
        data-testid="support-messages"
      >
        <div
          v-if="messages.length === 0"
          class="support__state"
          data-testid="state-empty"
        >
          <p>试试问我：「支持哪些配送方式？」「退换货规则是什么？」</p>
        </div>
        <template
          v-for="(m, i) in messages"
          :key="i"
        >
          <div
            class="support__bubble"
            :class="`support__bubble--${m.role}`"
            :data-testid="`bubble-${m.role}`"
          >
            {{ m.text }}
          </div>
          <!-- 引用列表（仅 assistant 且 sources 非空） -->
          <ul
            v-if="m.sources && m.sources.length > 0"
            class="support__sources"
            data-testid="support-sources"
          >
            <li
              v-for="source in m.sources"
              :key="source.documentId"
              class="support__source"
              data-testid="support-source"
            >
              <details class="support__source-details">
                <summary
                  class="support__source-title"
                  data-testid="support-source-title"
                >{{ source.title }}</summary>
                <p class="support__source-snippet">{{ source.snippet }}</p>
              </details>
            </li>
          </ul>
        </template>
        <div
          v-if="loading"
          class="support__bubble support__bubble--assistant"
          data-testid="support-loading"
        >
          正在查找…<span class="support__dots" />
        </div>
      </div>

      <!-- 客服边界引导：订单类问题请走订单助手 -->
      <p class="support__guide">
        订单查询、取消等问题，请使用
        <router-link
          to="/ai/orders"
          class="support__guide-link"
          data-testid="support-orders-link"
        >AI 订单助手</router-link>
      </p>

      <!-- 错误重试态 -->
      <div
        v-if="errorState"
        class="support__state support__state--error"
        data-testid="state-error"
      >
        <p>出错了，请重试。</p>
        <button
          class="support__retry"
          data-testid="state-retry"
          @click="retry"
        >重试</button>
      </div>

      <!-- 输入区 -->
      <form
        class="support__input"
        data-testid="support-form"
        @submit.prevent="send"
      >
        <input
          v-model="draft"
          class="support__input-box"
          type="text"
          placeholder="例如：支持哪些配送方式？"
          :disabled="loading"
          data-testid="support-input"
        >
        <button
          class="support__send"
          type="submit"
          :disabled="!canSend"
          data-testid="support-send"
        >发送</button>
      </form>

      <button
        class="support__reset"
        type="button"
        :disabled="loading"
        data-testid="support-new-session"
        @click="resetSession"
      >新会话</button>
    </template>
  </section>
</template>

<style scoped>
.support {
  max-width: 760px;
  margin: 0 auto;
  padding: var(--space-5, 20px) var(--space-4, 16px) var(--space-8, 32px);
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-height: 60vh;
}
.support__title {
  margin: 0;
  font-size: 22px;
}
.support__subtitle {
  margin: 4px 0 0;
  color: var(--color-text-secondary, #777);
  font-size: 13px;
}
.support__list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 48vh;
  overflow-y: auto;
  padding: 4px;
}
.support__bubble {
  max-width: 78%;
  padding: 10px 14px;
  border-radius: 14px;
  font-size: 14px;
  line-height: 1.5;
  word-break: break-word;
}
.support__bubble--user {
  align-self: flex-end;
  background: var(--color-brand, #ff5b3a);
  color: #fff;
  border-bottom-right-radius: 4px;
}
.support__bubble--assistant {
  align-self: flex-start;
  background: var(--color-surface-muted, #f4f4f6);
  color: var(--color-text, #222);
  border-bottom-left-radius: 4px;
}
.support__sources {
  align-self: flex-start;
  list-style: none;
  margin: -4px 0 0;
  padding: 0;
  width: 80%;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.support__source-details {
  border: 1px solid var(--color-border, #e6e6ea);
  border-radius: 10px;
  padding: 6px 10px;
  background: var(--color-surface, #fff);
  font-size: 13px;
}
.support__source-title {
  cursor: pointer;
  font-weight: 600;
  color: var(--color-text-secondary, #555);
}
.support__source-snippet {
  margin: 8px 0 2px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--color-text-secondary, #666);
}
.support__guide {
  margin: 0;
  font-size: 12px;
  color: var(--color-text-tertiary, #999);
}
.support__guide-link {
  color: var(--color-brand, #ff5b3a);
}
.support__state {
  padding: 24px;
  text-align: center;
  color: var(--color-text-secondary, #777);
  background: var(--color-surface-muted, #f4f4f6);
  border-radius: 14px;
  font-size: 14px;
}
.support__state--error {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}
.support__retry {
  padding: 6px 18px;
  border: none;
  border-radius: 999px;
  background: var(--color-brand, #ff5b3a);
  color: #fff;
  cursor: pointer;
}
.support__input {
  display: flex;
  gap: 8px;
}
.support__input-box {
  flex: 1;
  padding: 11px 14px;
  border-radius: 999px;
  border: 1px solid var(--color-border, #e5e5e8);
  font-size: 14px;
  outline: none;
}
.support__input-box:focus {
  border-color: var(--color-brand, #ff5b3a);
}
.support__send {
  padding: 0 22px;
  border: none;
  border-radius: 999px;
  background: var(--color-brand, #ff5b3a);
  color: #fff;
  font-size: 14px;
  cursor: pointer;
}
.support__send:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.support__reset {
  align-self: flex-start;
  padding: 6px 16px;
  border: 1px solid var(--color-border, #ddd);
  border-radius: 999px;
  background: #fff;
  font-size: 13px;
  cursor: pointer;
}
.support__reset:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
