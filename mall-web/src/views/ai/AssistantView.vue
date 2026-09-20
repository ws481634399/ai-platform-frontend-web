<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { aiApi, type AiRecommendationItem } from '@/api/ai'

/**
 * AI 智能导购助手（CHG-0024 DU-FE-001）。
 *
 * 交互状态机（story-design §4 错误口径）：
 * - 发送 → loading（禁用发送）→ 助手气泡（澄清问题 / 总述）+ 推荐商品卡片；
 * - 403（开关关闭）→ 空态"AI 导购暂未开启"；4xx 参数 → 气泡提示重填；5xx/网络 → Error 态可重试；
 * - conversationId 会话内复用（多轮上下文由后端维护）。
 */

interface ChatMessage {
  role: 'user' | 'assistant'
  text: string
}

const messages = ref<ChatMessage[]>([])
const recommendations = ref<AiRecommendationItem[]>([])
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
  if (status === 400) return '输入似乎不太对，请换个说法再试试。'
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
  recommendations.value = []
  await scrollToBottom()
  try {
    const res = await aiApi.recommendations({ conversationId: conversationId.value, message: text })
    conversationId.value = res.conversationId
    if (res.clarifyingQuestion) {
      messages.value.push({ role: 'assistant', text: res.clarifyingQuestion })
    }
    if (res.message) {
      messages.value.push({ role: 'assistant', text: res.message })
    }
    if (!res.clarifyingQuestion && !res.message && res.recommendations.length === 0) {
      messages.value.push({ role: 'assistant', text: '未找到符合要求的商品，可换个说法或放宽预算试试。' })
    }
    recommendations.value = res.recommendations
  } catch (error: unknown) {
    const status = (error as { response?: { status?: number } })?.response?.status
    if (status === 403) {
      disabledState.value = true
    } else {
      errorState.value = true
      messages.value.push({ role: 'assistant', text: extractMessage(error, 'AI 服务暂时繁忙，请稍后重试。') })
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
</script>

<template>
  <section class="assistant">
    <header class="assistant__header">
      <h1 class="assistant__title">AI 导购助手</h1>
      <p class="assistant__subtitle">说说你的需求，我来帮你挑</p>
    </header>

    <!-- 开关关闭空态（后端 fail-closed 403） -->
    <div
      v-if="disabledState"
      class="assistant__state"
      data-testid="state-disabled"
    >
      <p>AI 导购暂未开启，敬请期待。</p>
    </div>

    <template v-else>
      <!-- 对话区 -->
      <div
        ref="listEl"
        class="assistant__list"
        data-testid="assistant-messages"
      >
        <div
          v-if="messages.length === 0"
          class="assistant__state"
          data-testid="state-empty"
        >
          <p>试试告诉我：预算、用途或想要的类型，比如「5000 元以内轻薄笔记本」。</p>
        </div>
        <div
          v-for="(m, i) in messages"
          :key="i"
          class="assistant__bubble"
          :class="`assistant__bubble--${m.role}`"
          :data-testid="`bubble-${m.role}`"
        >
          {{ m.text }}
        </div>
        <div
          v-if="loading"
          class="assistant__bubble assistant__bubble--assistant"
          data-testid="assistant-loading"
        >
          正在想…<span class="assistant__dots" />
        </div>
      </div>

      <!-- 推荐商品卡片 -->
      <div
        v-if="recommendations.length > 0"
        class="assistant__recs"
        data-testid="assistant-recommendations"
      >
        <article
          v-for="item in recommendations"
          :key="item.productId"
          class="assistant__card"
          :data-testid="`recommendation-${item.productId}`"
        >
          <img
            v-if="item.image"
            :src="item.image"
            :alt="item.productName"
            class="assistant__card-img"
          >
          <div class="assistant__card-body">
            <h3 class="assistant__card-name">{{ item.productName }}</h3>
            <p class="assistant__card-reason">{{ item.reason }}</p>
            <p class="assistant__card-price">￥{{ item.price }}<span class="assistant__card-tip">价格以结算页为准</span></p>
          </div>
        </article>
      </div>

      <!-- 错误重试态 -->
      <div
        v-if="errorState"
        class="assistant__state assistant__state--error"
        data-testid="state-error"
      >
        <p>出错了，请重试。</p>
        <button
          class="assistant__retry"
          data-testid="state-retry"
          @click="retry"
        >重试</button>
      </div>

      <!-- 输入区 -->
      <form
        class="assistant__input"
        data-testid="assistant-form"
        @submit.prevent="send"
      >
        <input
          v-model="draft"
          class="assistant__input-box"
          type="text"
          placeholder="例如：3000 元以内送长辈的手机"
          :disabled="loading"
          data-testid="assistant-input"
        >
        <button
          class="assistant__send"
          type="submit"
          :disabled="!canSend"
          data-testid="assistant-send"
        >发送</button>
      </form>
    </template>
  </section>
</template>

<style scoped>
.assistant {
  max-width: 760px;
  margin: 0 auto;
  padding: var(--space-5, 20px) var(--space-4, 16px) var(--space-8, 32px);
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 60vh;
}
.assistant__title {
  margin: 0;
  font-size: 22px;
}
.assistant__subtitle {
  margin: 4px 0 0;
  color: var(--color-text-secondary, #777);
  font-size: 13px;
}
.assistant__list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 46vh;
  overflow-y: auto;
  padding: 4px;
}
.assistant__bubble {
  max-width: 78%;
  padding: 10px 14px;
  border-radius: 14px;
  font-size: 14px;
  line-height: 1.5;
  word-break: break-word;
}
.assistant__bubble--user {
  align-self: flex-end;
  background: var(--color-brand, #ff5b3a);
  color: #fff;
  border-bottom-right-radius: 4px;
}
.assistant__bubble--assistant {
  align-self: flex-start;
  background: var(--color-surface-muted, #f4f4f6);
  color: var(--color-text, #222);
  border-bottom-left-radius: 4px;
}
.assistant__recs {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.assistant__card {
  display: flex;
  gap: 12px;
  padding: 12px;
  border-radius: 14px;
  background: var(--color-surface, #fff);
  box-shadow: 0 2px 10px rgb(0 0 0 / 6%);
}
.assistant__card-img {
  width: 84px;
  height: 84px;
  border-radius: 10px;
  object-fit: cover;
  flex: none;
}
.assistant__card-name {
  margin: 0 0 4px;
  font-size: 15px;
}
.assistant__card-reason {
  margin: 0 0 6px;
  font-size: 12px;
  color: var(--color-text-secondary, #777);
}
.assistant__card-price {
  margin: 0;
  font-weight: 700;
  color: var(--color-brand, #ff5b3a);
}
.assistant__card-tip {
  margin-left: 8px;
  font-size: 11px;
  font-weight: 400;
  color: var(--color-text-tertiary, #aaa);
}
.assistant__state {
  padding: 24px;
  text-align: center;
  color: var(--color-text-secondary, #777);
  background: var(--color-surface-muted, #f4f4f6);
  border-radius: 14px;
  font-size: 14px;
}
.assistant__state--error {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}
.assistant__retry {
  padding: 6px 18px;
  border: none;
  border-radius: 999px;
  background: var(--color-brand, #ff5b3a);
  color: #fff;
  cursor: pointer;
}
.assistant__input {
  display: flex;
  gap: 8px;
  position: sticky;
  bottom: 0;
  background: inherit;
  padding-top: 4px;
}
.assistant__input-box {
  flex: 1;
  padding: 11px 14px;
  border-radius: 999px;
  border: 1px solid var(--color-border, #e5e5e8);
  font-size: 14px;
  outline: none;
}
.assistant__input-box:focus {
  border-color: var(--color-brand, #ff5b3a);
}
.assistant__send {
  padding: 0 22px;
  border: none;
  border-radius: 999px;
  background: var(--color-brand, #ff5b3a);
  color: #fff;
  font-size: 14px;
  cursor: pointer;
}
.assistant__send:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
</style>
