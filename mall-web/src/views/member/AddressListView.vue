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
      class="address-view__loading"
      data-testid="address-loading"
    >
      地址加载中…
    </p>
    <p
      v-else-if="loadingError"
      class="address-view__error"
      data-testid="address-load-error"
    >
      {{ loadingError }}
    </p>

    <div
      v-else-if="addressStore.items.length === 0"
      class="address-view__empty"
      data-testid="address-empty"
    >
      <p>还没有收货地址，新增一个吧。</p>
      <button
        type="button"
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
            <span class="address-card__phone">{{ address.receiverPhone }}</span>
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
            class="address-card__default-btn"
            :data-testid="`address-set-default-${address.id}`"
            @click="makeDefault(address)"
          >
            设为默认
          </button>
          <button
            type="button"
            class="address-card__edit-btn"
            :data-testid="`address-edit-${address.id}`"
            @click="openEdit(address)"
          >
            编辑
          </button>
          <button
            type="button"
            class="address-card__delete-btn"
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
          <span>收货人姓名</span>
          <input
            v-model="form.receiverName"
            type="text"
            maxlength="32"
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
          <span>手机号</span>
          <input
            v-model="form.receiverPhone"
            type="tel"
            maxlength="11"
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
            <span>省份</span>
            <input
              v-model="form.province"
              type="text"
              maxlength="64"
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
            <span>城市</span>
            <input
              v-model="form.city"
              type="text"
              maxlength="64"
              data-testid="address-form-city"
            >
            <small
              v-if="fieldErrors.city"
              class="address-dialog__error"
            >{{ fieldErrors.city }}</small>
          </label>
          <label class="address-dialog__field">
            <span>区县</span>
            <input
              v-model="form.district"
              type="text"
              maxlength="64"
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
          <span>详细地址</span>
          <input
            v-model="form.detailAddress"
            type="text"
            maxlength="128"
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
          <span>邮政编码（选填）</span>
          <input
            v-model="form.postalCode"
            type="text"
            maxlength="6"
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
            class="address-dialog__cancel"
            data-testid="address-dialog-cancel"
            :disabled="dialogSaving"
            @click="closeDialog"
          >
            取消
          </button>
          <button
            type="submit"
            class="address-dialog__submit"
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
  margin-bottom: 16px;
}

.address-view__title {
  margin: 0;
  font-size: 20px;
}

.address-view__new,
.address-view__empty button,
.address-card__actions button,
.address-dialog__buttons button {
  padding: 6px 16px;
  border-radius: 6px;
  cursor: pointer;
}

.address-view__new,
.address-dialog__submit {
  color: #fff;
  background: #2563eb;
  border: 1px solid #2563eb;
}

.address-view__limit-hint {
  color: #6b7280;
  font-size: 13px;
}

.address-view__loading,
.address-view__error {
  font-size: 14px;
}

.address-view__error {
  color: #dc2626;
}

.address-view__message {
  margin: 0 0 12px;
  font-size: 13px;
}

.address-view__message--success {
  color: #16a34a;
}

.address-view__message--error {
  color: #dc2626;
}

.address-view__empty {
  padding: 40px;
  text-align: center;
  border: 1px dashed #d1d5db;
  border-radius: 8px;
  color: #6b7280;
}

.address-view__list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 0;
  margin: 0;
  list-style: none;
}

.address-card {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.address-card--default {
  border-color: #2563eb;
}

.address-card__head {
  display: flex;
  gap: 10px;
  align-items: center;
}

.address-card__name {
  font-weight: 600;
}

.address-card__badge {
  padding: 1px 8px;
  color: #2563eb;
  font-size: 12px;
  border: 1px solid #2563eb;
  border-radius: 999px;
}

.address-card__region,
.address-card__detail,
.address-card__postal {
  margin: 4px 0 0;
  font-size: 14px;
  color: #374151;
}

.address-card__actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.address-card__actions button {
  font-size: 13px;
  background: #fff;
  border: 1px solid #d1d5db;
}

.address-card__default-btn {
  color: #2563eb;
}

.address-card__delete-btn {
  color: #dc2626;
}

.address-dialog__mask {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgb(0 0 0 / 45%);
}

.address-dialog {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 480px;
  max-width: calc(100vw - 32px);
  padding: 20px;
  background: #fff;
  border-radius: 10px;
}

.address-dialog__title {
  margin: 0;
  font-size: 17px;
}

.address-dialog__field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 14px;
}

.address-dialog__row {
  display: flex;
  gap: 10px;
}

.address-dialog__row .address-dialog__field {
  flex: 1;
}

.address-dialog__field input {
  padding: 8px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
}

.address-dialog__error {
  color: #dc2626;
  font-size: 12px;
}

.address-dialog__message {
  margin: 0;
  color: #dc2626;
  font-size: 13px;
}

.address-dialog__buttons {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.address-dialog__cancel {
  background: #fff;
  border: 1px solid #d1d5db;
}
</style>
