<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useAddressStore } from '@/stores/address'
import { resolveErrorMessage } from '@/utils/http-error'
import {
  ADDRESS_LIMIT,
  buildAddressRequest,
  toFormValues,
  validateAddressForm,
  type AddressFieldErrors,
  type AddressFormValues,
} from '@/utils/address-form'
import type { ShippingAddressView } from '@/types/address'

const addressStore = useAddressStore()

const loadingError = ref('')
const pageMessage = ref('')
const pageMessageType = ref<'success' | 'error'>('success')

// ── 新增/编辑弹层 ───────────────────────────────────────────────
const dialogOpen = ref(false)
const editingId = ref<string | null>(null)
const dialogSaving = ref(false)
const dialogMessage = ref('')
const fieldErrors = reactive<AddressFieldErrors>({})
const emptyForm = (): AddressFormValues => ({
  receiverName: '',
  receiverPhone: '',
  province: '',
  city: '',
  district: '',
  detailAddress: '',
  postalCode: '',
})
const form = reactive<AddressFormValues>(emptyForm())

const dialogTitle = () => (editingId.value ? '编辑收货地址' : '新增收货地址')

function openCreate() {
  editingId.value = null
  Object.assign(form, emptyForm())
  clearDialogErrors()
  dialogMessage.value = ''
  dialogOpen.value = true
}

function openEdit(address: ShippingAddressView) {
  editingId.value = address.id
  Object.assign(form, toFormValues(address))
  clearDialogErrors()
  dialogMessage.value = ''
  dialogOpen.value = true
}

function closeDialog() {
  if (dialogSaving.value) return
  dialogOpen.value = false
}

function clearDialogErrors() {
  Object.keys(fieldErrors).forEach((key) => {
    fieldErrors[key as keyof AddressFieldErrors] = ''
  })
}

async function submitDialog() {
  dialogMessage.value = ''
  clearDialogErrors()
  const errors = validateAddressForm(form)
  Object.assign(fieldErrors, errors)
  if (Object.values(errors).some(Boolean)) return

  dialogSaving.value = true
  try {
    const request = buildAddressRequest(form)
    if (editingId.value) {
      await addressStore.updateAddress(editingId.value, request)
    } else {
      await addressStore.addAddress(request)
    }
    dialogOpen.value = false
    notify('success', editingId.value ? '地址已更新' : '地址已新增')
  } catch (error) {
    // 400 字段错误 / 409 上限：弹层保持打开，不丢已填内容
    dialogMessage.value = resolveErrorMessage(error, '保存失败，请稍后重试')
  } finally {
    dialogSaving.value = false
  }
}

// ── 删除 / 设默认 ───────────────────────────────────────────────
async function remove(address: ShippingAddressView) {
  if (!window.confirm(`确认删除 ${address.receiverName} 的收货地址？`)) return
  try {
    await addressStore.removeAddress(address.id)
    notify('success', '地址已删除')
  } catch (error) {
    notify('error', resolveErrorMessage(error, '删除失败，请稍后重试'))
  }
}

async function makeDefault(address: ShippingAddressView) {
  try {
    await addressStore.setDefault(address.id)
    notify('success', '默认地址已更新')
  } catch (error) {
    notify('error', resolveErrorMessage(error, '设置默认地址失败，请稍后重试'))
  }
}

function notify(type: 'success' | 'error', message: string) {
  pageMessageType.value = type
  pageMessage.value = message
}

function regionLine(address: ShippingAddressView) {
  return [address.province, address.city, address.district].join(' ')
}

onMounted(async () => {
  try {
    await addressStore.fetchList(true)
  } catch (error) {
    loadingError.value = resolveErrorMessage(error, '地址加载失败，请稍后重试')
  }
})
</script>

<template>
  <section
    class="address-view"
    data-testid="member-address-view"
  >
    <header class="address-view__header">
      <h1 class="address-view__title">
        收货地址
      </h1>
      <button
        v-if="!addressStore.reachLimit"
        type="button"
        class="address-view__new"
        data-testid="address-new-button"
        @click="openCreate"
      >
        新增地址
      </button>
      <span
        v-else
        class="address-view__limit-hint"
        data-testid="address-limit-hint"
      >
        最多保存 {{ ADDRESS_LIMIT }} 条地址
      </span>
    </header>

    <p
      v-if="pageMessage"
      class="address-view__message"
      :class="`address-view__message--${pageMessageType}`"
      data-testid="address-page-message"
    >
      {{ pageMessage }}
    </p>

    <p
      v-if="addressStore.loading"
      class="address-view__state"
      data-testid="address-loading"
    >
      地址加载中…
    </p>
    <p
      v-else-if="loadingError"
      class="address-view__state address-view__state--error"
      data-testid="address-load-error"
    >
      {{ loadingError }}
    </p>

    <div
      v-else-if="addressStore.items.length === 0"
      class="address-view__empty"
      data-testid="address-empty"
    >
      <p class="address-view__empty-text">还没有收货地址</p>
      <button
        type="button"
        class="address-view__empty-action"
        data-testid="address-empty-new"
        @click="openCreate"
      >
        新增地址
      </button>
    </div>

    <ul
      v-else
      class="address-view__list"
      data-testid="address-list"
    >
      <li
        v-for="address in addressStore.items"
        :key="address.id"
        class="address-card"
        :class="{ 'address-card--default': address.isDefault }"
        :data-testid="`address-item-${address.id}`"
      >
        <div class="address-card__main">
          <div class="address-card__head">
            <span
              class="address-card__name"
              data-testid="address-receiver-name"
            >
              {{ address.receiverName }}
            </span>
            <span class="address-card__phone tabular">{{ address.receiverPhone }}</span>
            <span
              v-if="address.isDefault"
              class="address-card__badge"
              data-testid="address-default-badge"
            >
              默认
            </span>
          </div>
          <p class="address-card__region">
            {{ regionLine(address) }}
          </p>
          <p class="address-card__detail">
            {{ address.detailAddress }}
          </p>
          <p
            v-if="address.postalCode"
            class="address-card__postal"
          >
            邮编：{{ address.postalCode }}
          </p>
        </div>
        <div class="address-card__actions">
          <button
            v-if="!address.isDefault"
            type="button"
            class="address-card__action address-card__action--default"
            :data-testid="`address-set-default-${address.id}`"
            @click="makeDefault(address)"
          >
            设为默认
          </button>
          <button
            type="button"
            class="address-card__action"
            :data-testid="`address-edit-${address.id}`"
            @click="openEdit(address)"
          >
            编辑
          </button>
          <button
            type="button"
            class="address-card__action address-card__action--danger"
            :data-testid="`address-delete-${address.id}`"
            @click="remove(address)"
          >
            删除
          </button>
        </div>
      </li>
    </ul>

    <div
      v-if="dialogOpen"
      class="address-dialog__mask"
      data-testid="address-dialog-mask"
      @click.self="closeDialog"
    >
      <form
        class="address-dialog"
        data-testid="address-dialog"
        @submit.prevent="submitDialog"
      >
        <h2 class="address-dialog__title">
          {{ dialogTitle() }}
        </h2>

        <label class="address-dialog__field">
          <span class="address-dialog__label">收货人姓名</span>
          <input
            v-model="form.receiverName"
            type="text"
            maxlength="32"
            class="address-dialog__input"
            data-testid="address-form-receiver"
          >
          <small
            v-if="fieldErrors.receiverName"
            class="address-dialog__error"
          >{{
            fieldErrors.receiverName
          }}</small>
        </label>

        <label class="address-dialog__field">
          <span class="address-dialog__label">手机号</span>
          <input
            v-model="form.receiverPhone"
            type="tel"
            maxlength="11"
            class="address-dialog__input"
            data-testid="address-form-phone"
          >
          <small
            v-if="fieldErrors.receiverPhone"
            class="address-dialog__error"
          >{{
            fieldErrors.receiverPhone
          }}</small>
        </label>

        <div class="address-dialog__row">
          <label class="address-dialog__field">
            <span class="address-dialog__label">省份</span>
            <input
              v-model="form.province"
              type="text"
              maxlength="64"
              class="address-dialog__input"
              data-testid="address-form-province"
            >
            <small
              v-if="fieldErrors.province"
              class="address-dialog__error"
            >{{
              fieldErrors.province
            }}</small>
          </label>
          <label class="address-dialog__field">
            <span class="address-dialog__label">城市</span>
            <input
              v-model="form.city"
              type="text"
              maxlength="64"
              class="address-dialog__input"
              data-testid="address-form-city"
            >
            <small
              v-if="fieldErrors.city"
              class="address-dialog__error"
            >{{ fieldErrors.city }}</small>
          </label>
          <label class="address-dialog__field">
            <span class="address-dialog__label">区县</span>
            <input
              v-model="form.district"
              type="text"
              maxlength="64"
              class="address-dialog__input"
              data-testid="address-form-district"
            >
            <small
              v-if="fieldErrors.district"
              class="address-dialog__error"
            >{{
              fieldErrors.district
            }}</small>
          </label>
        </div>

        <label class="address-dialog__field">
          <span class="address-dialog__label">详细地址</span>
          <input
            v-model="form.detailAddress"
            type="text"
            maxlength="128"
            class="address-dialog__input"
            data-testid="address-form-detail"
          >
          <small
            v-if="fieldErrors.detailAddress"
            class="address-dialog__error"
          >{{
            fieldErrors.detailAddress
          }}</small>
        </label>

        <label class="address-dialog__field">
          <span class="address-dialog__label">邮政编码（选填）</span>
          <input
            v-model="form.postalCode"
            type="text"
            maxlength="6"
            class="address-dialog__input"
            data-testid="address-form-postal"
          >
          <small
            v-if="fieldErrors.postalCode"
            class="address-dialog__error"
          >{{
            fieldErrors.postalCode
          }}</small>
        </label>

        <p
          v-if="dialogMessage"
          class="address-dialog__message"
          data-testid="address-dialog-message"
        >
          {{ dialogMessage }}
        </p>

        <div class="address-dialog__buttons">
          <button
            type="button"
            class="address-dialog__btn address-dialog__btn--ghost"
            data-testid="address-dialog-cancel"
            :disabled="dialogSaving"
            @click="closeDialog"
          >
            取消
          </button>
          <button
            type="submit"
            class="address-dialog__btn address-dialog__btn--primary"
            data-testid="address-dialog-submit"
            :disabled="dialogSaving"
          >
            {{ dialogSaving ? '保存中…' : '保存' }}
          </button>
        </div>
      </form>
    </div>
  </section>
</template>

<style scoped>
.address-view {
  max-width: 720px;
  margin: 0 auto;
}

.address-view__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-5);
}

.address-view__title {
  margin: 0;
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--color-text);
  letter-spacing: var(--tracking-tight);
}

.address-view__new {
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
  cursor: pointer;
  background: var(--color-primary);
  color: var(--color-text-on-primary);
  border: 1px solid var(--color-primary);
  font-size: var(--text-sm);
  font-weight: 500;
  transition: background var(--transition-fast);
}
.address-view__new:hover {
  background: var(--color-primary-hover);
}

.address-view__limit-hint {
  color: var(--color-text-tertiary);
  font-size: var(--text-sm);
}

.address-view__state {
  font-size: var(--text-sm);
  color: var(--color-text-tertiary);
}
.address-view__state--error {
  color: var(--color-danger);
}

.address-view__message {
  margin: 0 0 var(--space-3);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
}
.address-view__message--success {
  background: var(--color-success-bg);
  color: var(--color-success);
}
.address-view__message--error {
  background: var(--color-danger-bg);
  color: var(--color-danger);
}

.address-view__empty {
  padding: var(--space-10) var(--space-6);
  text-align: center;
  border: 1px dashed var(--color-border-strong);
  border-radius: var(--radius-lg);
  color: var(--color-text-tertiary);
}
.address-view__empty-text {
  margin: 0 0 var(--space-3);
  font-size: var(--text-base);
}
.address-view__empty-action {
  padding: var(--space-2) var(--space-4);
  border: 1px solid var(--color-text);
  border-radius: var(--radius-md);
  background: var(--color-bg);
  color: var(--color-text);
  font-size: var(--text-sm);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
}
.address-view__empty-action:hover {
  background: var(--color-primary);
  color: var(--color-text-on-primary);
  border-color: var(--color-primary);
}

/* ── 地址卡 ──────────────────────────── */
.address-view__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: 0;
  margin: 0;
  list-style: none;
}

.address-card {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-bg);
  transition: border-color var(--transition-fast);
}
.address-card:hover {
  border-color: var(--color-border-strong);
}
.address-card--default {
  border-color: var(--color-text);
  background: var(--color-bg-subtle);
}

.address-card__main {
  flex: 1;
  min-width: 0;
}

.address-card__head {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
  flex-wrap: wrap;
}
.address-card__name {
  font-weight: 600;
  color: var(--color-text);
  font-size: var(--text-md);
}
.address-card__phone {
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
}
.address-card__badge {
  padding: 0 var(--space-2);
  background: var(--color-text);
  color: var(--color-text-on-primary);
  font-size: var(--text-xs);
  border-radius: var(--radius-xs);
  font-weight: 500;
}

.address-card__region,
.address-card__detail,
.address-card__postal {
  margin: var(--space-1) 0 0;
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
}

.address-card__actions {
  display: flex;
  gap: var(--space-1);
  flex-shrink: 0;
}

.address-card__action {
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-sm);
  background: transparent;
  border: 1px solid transparent;
  color: var(--color-text-secondary);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}
.address-card__action:hover {
  background: var(--color-bg-muted);
  color: var(--color-text);
}
.address-card__action--default:hover {
  color: var(--color-accent);
}
.address-card__action--danger:hover {
  background: var(--color-danger-bg);
  color: var(--color-danger);
}

/* ── 弹层 ────────────────────────────── */
.address-dialog__mask {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-overlay);
  z-index: 100;
  padding: var(--space-4);
}

.address-dialog {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  width: 480px;
  max-width: 100%;
  max-height: calc(100vh - var(--space-8));
  overflow-y: auto;
  padding: var(--space-6);
  background: var(--color-bg);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
}

.address-dialog__title {
  margin: 0;
  font-size: var(--text-xl);
  font-weight: 700;
  color: var(--color-text);
  letter-spacing: var(--tracking-tight);
}

.address-dialog__field {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  font-size: var(--text-sm);
}
.address-dialog__label {
  color: var(--color-text-secondary);
  font-weight: 500;
}
.address-dialog__row {
  display: flex;
  gap: var(--space-3);
}
.address-dialog__row .address-dialog__field {
  flex: 1;
}
.address-dialog__input {
  padding: var(--space-3);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
  background: var(--color-bg);
  color: var(--color-text);
  font-size: var(--text-base);
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}
.address-dialog__input:focus {
  outline: none;
  border-color: var(--color-border-focus);
  box-shadow: var(--shadow-focus);
}
.address-dialog__error {
  color: var(--color-danger);
  font-size: var(--text-xs);
}
.address-dialog__message {
  margin: 0;
  padding: var(--space-2) var(--space-3);
  background: var(--color-danger-bg);
  color: var(--color-danger);
  font-size: var(--text-sm);
  border-radius: var(--radius-md);
}
.address-dialog__buttons {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
}
.address-dialog__btn {
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: var(--text-sm);
  font-weight: 500;
  transition: all var(--transition-fast);
}
.address-dialog__btn--ghost {
  background: var(--color-bg);
  border: 1px solid var(--color-border-strong);
  color: var(--color-text-secondary);
}
.address-dialog__btn--ghost:hover:not(:disabled) {
  border-color: var(--color-text);
  color: var(--color-text);
}
.address-dialog__btn--primary {
  background: var(--color-primary);
  border: 1px solid var(--color-primary);
  color: var(--color-text-on-primary);
}
.address-dialog__btn--primary:hover:not(:disabled) {
  background: var(--color-primary-hover);
  border-color: var(--color-primary-hover);
}
.address-dialog__btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 600px) {
  .address-dialog__row {
    flex-direction: column;
  }
  .address-card {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
