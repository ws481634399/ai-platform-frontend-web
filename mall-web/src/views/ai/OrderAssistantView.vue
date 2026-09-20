<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  aiApi,
  type AiOrderItem,
  type AiOrdersAssistantResponse,
  type AiPendingAction,
} from '@/api/ai'

/**
 * AI 订单助手（CHG-0024 DU-FE-004）。
 *
 * 交互状态机（story-design §1/§4）：
 * - 问答 → 订单卡片（orderNo/statusText/金额/商品摘要）；
 * - pendingAction 存在 → 必须先在二次确认弹窗确认，才调 /confirm（写操作）；
 * - 401 → 引导登录；403 → 开关关闭空态；409 → 透出后端消息（不重复取消）；
 * - 5xx/网络 → Error 态可重试（复用上一条消息）。
 */

interface ChatMessage {
  role: 'user' | 'assistant'
  text: string
}

const messages = ref<ChatMessage[]>([])
const orders = ref<AiOrderItem[]>([])
const draft = ref('')
const loading = ref(false)
const confirming = ref(false)
const errorState = ref(false)
const disabledState = ref(false)
const unauthorizedState = ref(false)
const conversationId = ref<string | undefined>(undefined)
const lastSent = ref('')
const pendingAction = ref<AiPendingAction | null>(null)
const confirmResult = ref<string | null>(null)
const listEl = ref<HTMLElement | null>(null)
const router = useRouter()

const canSend = computed(() => !loading.value && draft.value.trim().length > 0)

async function scrollToBottom(): Promise<void> {
  await nextTick()
  listEl.value?.scrollTo({ top: listEl.value.scrollHeight, behavior: 'smooth' })
}

function extractMessage(error: unknown): string {
  const data = (error as { response?: { data?: { message?: string } } })?.response?.data
  if (data?.message) return data.message
  return 'AI 服务暂时繁忙，请稍后重试。'
}

async function send(): Promise<void> {
  const text = draft.value.trim()
  if (!text || loading.value) return
  lastSent.value = text
  messages.value.push({ role: 'user', text })
  draft.value = ''
  loading.value = true
  errorState.value = false
  orders.value = []
  await scrollToBottom()
  try {
    const res: AiOrdersAssistantResponse = await aiApi.ordersAssistant({
      conversationId: conversationId.value,
      message: text,
    })
    conversationId.value = res.conversationId
    if (res.message) {
      messages.value.push({ role: 'assistant', text: res.message })
    }
    orders.value = res.orders
    pendingAction.value = res.pendingAction
    confirmResult.value = null
  } catch (error: unknown) {
    const status = (error as { response?: { status?: number } })?.response?.status
    if (status === 401) {
      unauthorizedState.value = true
    } else if (status === 403) {
      disabledState.value = true
    } else {
      // 含 409：状态不允许取消 / 令牌缺失或已消费——原样透出后端 message
      errorState.value = true
      messages.value.push({ role: 'assistant', text: extractMessage(error) })
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

function cancelConfirm(): void {
  // 关闭弹窗即放弃本次动作，不产生任何写副作用（actionId 仍在后端保留至 TTL）
  pendingAction.value = null
}

async function confirmAction(): Promise<void> {
  const action = pendingAction.value
  if (!action || !conversationId.value || confirming.value) return
  confirming.value = true
  try {
    const res = await aiApi.ordersConfirm({
      conversationId: conversationId.value,
      actionId: action.actionId,
      confirm: true,
    })
    confirmResult.value = res.message || `订单 ${res.order.orderNo} 已取消`
    messages.value.push({
      role: 'assistant',
      text: `${res.message || '订单已取消'}（当前状态：${res.order.statusText}）`,
    })
    pendingAction.value = null
    orders.value = orders.value.map((o) =>
      o.orderNo === res.order.orderNo
        ? { ...o, status: res.order.status, statusText: res.order.statusText }
        : o,
    )
  } catch (error: unknown) {
    // 409：令牌已消费 / Java 业务拒绝；5xx：上游失败——均透出后端消息并关弹窗
    messages.value.push({ role: 'assistant', text: extractMessage(error) })
    pendingAction.value = null
    errorState.value = true
  } finally {
    confirming.value = false
    await scrollToBottom()
  }
}

function goLogin(): void {
  void router.push({ path: '/login', query: { redirect: '/ai/orders' } })
}
</script>

<template>
  <section class="orders-ai">
    <header class="orders-ai__header">
      <h1 class="orders-ai__title">AI 订单助手</h1>
      <p class="orders-ai__subtitle">查订单、改状态，告诉我就行</p>
    </header>

    <!-- 未登录引导 -->
    <div
      v-if="unauthorizedState"
      class="orders-ai__state"
      data-testid="state-unauthorized"
    >
      <p>使用订单助手需要先登录。</p>
      <button
        class="orders-ai__login-btn"
        data-testid="orders-login-button"
        @click="goLogin"
      >去登录</button>
    </div>

    <!-- 开关关闭空态（后端 fail-closed 403） -->
    <div
      v-else-if="disabledState"
      class="orders-ai__state"
      data-testid="state-disabled"
    >
      <p>AI 订单助手暂未开启，敬请期待。</p>
    </div>

    <template v-else>
      <!-- 对话区 -->
      <div
        ref="listEl"
        class="orders-ai__list"
        data-testid="orders-ai-messages"
      >
        <div
          v-if="messages.length === 0"
          class="orders-ai__state"
          data-testid="state-empty"
        >
          <p>试试问我：「我最近的订单」「帮我取消待支付订单 20260920001」。</p>
        </div>
        <div
          v-for="(m, i) in messages"
          :key="i"
          class="orders-ai__bubble"
          :class="`orders-ai__bubble--${m.role}`"
          :data-testid="`bubble-${m.role}`"
        >
          {{ m.text }}
        </div>
        <div
          v-if="loading"
          class="orders-ai__bubble orders-ai__bubble--assistant"
          data-testid="orders-ai-loading"
        >
          正在查询…<span class="orders-ai__dots" />
        </div>
      </div>

      <!-- 订单卡片列表 -->
      <div
        v-if="orders.length > 0"
        class="orders-ai__cards"
        data-testid="orders-ai-orders"
      >
        <article
          v-for="order in orders"
          :key="order.orderNo"
          class="orders-ai__card"
          :data-testid="`order-card-${order.orderNo}`"
        >
          <div class="orders-ai__card-head">
            <span class="orders-ai__order-no" data-testid="order-no">订单号：{{ order.orderNo }}</span>
            <span
              class="orders-ai__status"
              :class="`orders-ai__status--${order.status.toLowerCase()}`"
              data-testid="order-status"
            >{{ order.statusText }}</span>
          </div>
          <p class="orders-ai__product" data-testid="order-product">{{ order.productName || '商品摘要暂无' }}</p>
          <div class="orders-ai__card-foot">
            <span class="orders-ai__amount" data-testid="order-amount">￥{{ order.totalAmount }}</span>
            <span
              v-if="order.createdAt"
              class="orders-ai__time"
            >下单时间：{{ order.createdAt }}</span>
          </div>
        </article>
      </div>

      <p
        v-if="confirmResult"
        class="orders-ai__confirm-result"
        data-testid="orders-confirm-result"
      >
        {{ confirmResult }}
      </p>

      <!-- 错误重试态 -->
      <div
        v-if="errorState"
        class="orders-ai__state orders-ai__state--error"
        data-testid="state-error"
      >
        <p>出错了，请重试。</p>
        <button
          class="orders-ai__retry"
          data-testid="state-retry"
          @click="retry"
        >重试</button>
      </div>

      <!-- 输入区 -->
      <form
        class="orders-ai__input"
        data-testid="orders-ai-form"
        @submit.prevent="send"
      >
        <input
          v-model="draft"
          class="orders-ai__input-box"
          type="text"
          placeholder="例如：帮我看看待支付订单"
          :disabled="loading"
          data-testid="orders-ai-input"
        >
        <button
          class="orders-ai__send"
          type="submit"
          :disabled="!canSend"
          data-testid="orders-ai-send"
        >发送</button>
      </form>
    </template>

    <!-- 二次确认弹窗（原生模态，mall-web 无 element-plus） -->
    <div
      v-if="pendingAction"
      class="orders-ai__modal-mask"
      data-testid="orders-confirm-dialog"
    >
      <div
        class="orders-ai__modal"
        role="dialog"
        aria-modal="true"
      >
        <h2 class="orders-ai__modal-title">操作确认</h2>
        <p class="orders-ai__modal-text">
          {{ pendingAction.summary || `确认取消订单 ${pendingAction.orderNo} 吗？` }}
        </p>
        <dl class="orders-ai__modal-meta">
          <div>
            <dt>订单号</dt>
            <dd>{{ pendingAction.orderNo }}</dd>
          </div>
          <div>
            <dt>当前状态</dt>
            <dd>{{ pendingAction.orderStatus }}</dd>
          </div>
        </dl>
        <p class="orders-ai__modal-warning">取消后订单将关闭，如需商品请重新下单。</p>
        <div class="orders-ai__modal-actions">
          <button
            class="orders-ai__modal-cancel"
            data-testid="orders-confirm-cancel"
            :disabled="confirming"
            @click="cancelConfirm"
          >再想想</button>
          <button
            class="orders-ai__modal-ok"
            data-testid="orders-confirm-ok"
            :disabled="confirming"
            @click="confirmAction"
          >
            {{ confirming ? '处理中…' : '确认取消' }}
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.orders-ai {
  max-width: 760px;
  margin: 0 auto;
  padding: var(--space-5, 20px) var(--space-4, 16px) var(--space-8, 32px);
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 60vh;
}
.orders-ai__title {
  margin: 0;
  font-size: 22px;
}
.orders-ai__subtitle {
  margin: 4px 0 0;
  color: var(--color-text-secondary, #777);
  font-size: 13px;
}
.orders-ai__list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 42vh;
  overflow-y: auto;
  padding: 4px;
}
.orders-ai__bubble {
  max-width: 78%;
  padding: 10px 14px;
  border-radius: 14px;
  font-size: 14px;
  line-height: 1.5;
  word-break: break-word;
}
.orders-ai__bubble--user {
  align-self: flex-end;
  background: var(--color-brand, #ff5b3a);
  color: #fff;
  border-bottom-right-radius: 4px;
}
.orders-ai__bubble--assistant {
  align-self: flex-start;
  background: var(--color-surface-muted, #f4f4f6);
  color: var(--color-text, #222);
  border-bottom-left-radius: 4px;
}
.orders-ai__cards {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.orders-ai__card {
  padding: 14px;
  border-radius: 14px;
  background: var(--color-surface, #fff);
  box-shadow: 0 2px 10px rgb(0 0 0 / 6%);
}
.orders-ai__card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.orders-ai__order-no {
  font-size: 13px;
  font-weight: 600;
}
.orders-ai__status {
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  background: var(--color-surface-muted, #f0f0f2);
  color: var(--color-text-secondary, #666);
}
.orders-ai__status--paid {
  background: #e6f9ee;
  color: #0a8a4a;
}
.orders-ai__status--pending_payment {
  background: #fff1e0;
  color: #c2620a;
}
.orders-ai__status--cancelled {
  background: #f1f1f4;
  color: #888;
}
.orders-ai__product {
  margin: 8px 0;
  font-size: 13px;
  color: var(--color-text-secondary, #666);
}
.orders-ai__card-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.orders-ai__amount {
  font-weight: 700;
  color: var(--color-brand, #ff5b3a);
  font-size: 15px;
}
.orders-ai__time {
  font-size: 12px;
  color: var(--color-text-tertiary, #999);
}
.orders-ai__confirm-result {
  margin: 0;
  padding: 10px 14px;
  border-radius: 10px;
  background: #e6f9ee;
  color: #0a8a4a;
  font-size: 13px;
}
.orders-ai__state {
  padding: 24px;
  text-align: center;
  color: var(--color-text-secondary, #777);
  background: var(--color-surface-muted, #f4f4f6);
  border-radius: 14px;
  font-size: 14px;
}
.orders-ai__state--error {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}
.orders-ai__login-btn,
.orders-ai__retry {
  margin-top: 10px;
  padding: 6px 22px;
  border: none;
  border-radius: 999px;
  background: var(--color-brand, #ff5b3a);
  color: #fff;
  cursor: pointer;
}
.orders-ai__input {
  display: flex;
  gap: 8px;
}
.orders-ai__input-box {
  flex: 1;
  padding: 11px 14px;
  border-radius: 999px;
  border: 1px solid var(--color-border, #e5e5e8);
  font-size: 14px;
  outline: none;
}
.orders-ai__input-box:focus {
  border-color: var(--color-brand, #ff5b3a);
}
.orders-ai__send {
  padding: 0 22px;
  border: none;
  border-radius: 999px;
  background: var(--color-brand, #ff5b3a);
  color: #fff;
  font-size: 14px;
  cursor: pointer;
}
.orders-ai__send:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.orders-ai__modal-mask {
  position: fixed;
  inset: 0;
  background: rgb(30 10 20 / 45%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 16px;
}
.orders-ai__modal {
  width: 100%;
  max-width: 400px;
  background: #fff;
  border-radius: 18px;
  padding: 22px;
  box-shadow: 0 20px 60px rgb(0 0 0 / 25%);
}
.orders-ai__modal-title {
  margin: 0 0 10px;
  font-size: 18px;
}
.orders-ai__modal-text {
  margin: 0 0 14px;
  font-size: 15px;
  line-height: 1.6;
}
.orders-ai__modal-meta {
  margin: 0 0 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
}
.orders-ai__modal-meta div {
  display: flex;
  gap: 10px;
}
.orders-ai__modal-meta dt {
  color: var(--color-text-tertiary, #999);
}
.orders-ai__modal-meta dd {
  margin: 0;
  font-weight: 600;
}
.orders-ai__modal-warning {
  margin: 0 0 16px;
  font-size: 12px;
  color: var(--color-text-tertiary, #999);
}
.orders-ai__modal-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}
.orders-ai__modal-cancel {
  padding: 8px 18px;
  border-radius: 999px;
  border: 1px solid var(--color-border, #ddd);
  background: #fff;
  font-size: 14px;
  cursor: pointer;
}
.orders-ai__modal-ok {
  padding: 8px 20px;
  border-radius: 999px;
  border: none;
  background: var(--gradient-sunset, linear-gradient(135deg, #ff8a3a, #d6286e));
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}
.orders-ai__modal-ok:disabled,
.orders-ai__modal-cancel:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
