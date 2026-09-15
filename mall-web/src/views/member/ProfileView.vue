<script setup lang="ts">
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useMemberStore } from '@/stores/member'
import { resolveErrorMessage } from '@/utils/http-error'
import {
  AVATAR_MAX_BYTES,
  validateAvatarFile,
  validateProfileForm,
  type ProfileFieldErrors,
} from '@/utils/profile-form'
import type { MemberGender, UpdateMemberProfileRequest } from '@/types/member'

const member = useMemberStore()

const loading = ref(true)
const loadError = ref('')
const saving = ref(false)
const formMessage = ref('')
const formMessageType = ref<'success' | 'error'>('success')
const fieldErrors = reactive<ProfileFieldErrors>({})

const form = reactive({ nickname: '', gender: 'UNKNOWN' as MemberGender, phone: '', email: '' })

// ── 头像 ─────────────────────────────────────────────────────────
const previewUrl = ref('')
const uploading = ref(false)
const avatarMessage = ref('')
const avatarMessageType = ref<'success' | 'error'>('success')
let objectUrl: string | null = null

function revokePreview() {
  if (objectUrl) {
    URL.revokeObjectURL(objectUrl)
    objectUrl = null
  }
  previewUrl.value = ''
}

onMounted(async () => {
  try {
    const profile = await member.fetchProfile()
    form.nickname = profile.nickname
    form.gender = profile.gender
    form.phone = profile.phone ?? ''
    form.email = profile.email ?? ''
  } catch (error) {
    loadError.value = resolveErrorMessage(error, '资料加载失败，请稍后重试')
  } finally {
    loading.value = false
  }
})

onBeforeUnmount(revokePreview)

/** 组装变更字段：与已加载资料逐项 diff，无变更不发请求；手机/邮箱清空显式提交空串。 */
function buildPatch(): UpdateMemberProfileRequest | null {
  const current = member.profile
  if (!current) return null
  const patch: UpdateMemberProfileRequest = {}
  const nickname = form.nickname.trim()
  if (nickname !== current.nickname) patch.nickname = nickname
  if (form.gender !== current.gender) patch.gender = form.gender
  const phone = form.phone.trim()
  if (phone !== (current.phone ?? '')) patch.phone = phone
  const email = form.email.trim()
  if (email !== (current.email ?? '')) patch.email = email
  return Object.keys(patch).length > 0 ? patch : null
}

async function submit() {
  formMessage.value = ''
  Object.assign(fieldErrors, { nickname: '', gender: '', phone: '', email: '' })
  const errors = validateProfileForm(form)
  Object.assign(fieldErrors, errors)
  if (Object.values(errors).some(Boolean)) return

  const patch = buildPatch()
  if (!patch) {
    formMessageType.value = 'success'
    formMessage.value = '资料无变更'
    return
  }
  saving.value = true
  try {
    await member.saveProfile(patch)
    formMessageType.value = 'success'
    formMessage.value = '资料已保存'
  } catch (error) {
    formMessageType.value = 'error'
    formMessage.value = resolveErrorMessage(error, '保存失败，请稍后重试')
  } finally {
    saving.value = false
  }
}

async function pickAvatar(event: Event) {
  avatarMessage.value = ''
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  const hint = validateAvatarFile(file)
  if (hint) {
    avatarMessageType.value = 'error'
    avatarMessage.value = hint
    input.value = ''
    return
  }
  revokePreview()
  objectUrl = URL.createObjectURL(file)
  previewUrl.value = objectUrl
  uploading.value = true
  try {
    await member.changeAvatar(file)
    avatarMessageType.value = 'success'
    avatarMessage.value = '头像已更新'
    revokePreview()
  } catch (error) {
    // 失败保留旧头像与本地预览（用户可重试或重选），提示透传后端 503/400 文案
    avatarMessageType.value = 'error'
    avatarMessage.value = resolveErrorMessage(error, '头像上传失败，请稍后重试')
  } finally {
    uploading.value = false
    input.value = ''
  }
}

const avatarLimitLabel = `支持 jpeg/png/webp，大小不超过 ${Math.round(AVATAR_MAX_BYTES / 1024 / 1024)}MB`
</script>

<template>
  <section class="profile-view" data-testid="member-profile-view">
    <h1 class="profile-view__title">个人中心</h1>

    <p v-if="loading" class="profile-view__loading" data-testid="profile-loading">资料加载中…</p>
    <p v-else-if="loadError" class="profile-view__error" data-testid="profile-load-error">
      {{ loadError }}
    </p>

    <template v-else>
      <div class="profile-view__avatar-block">
        <div class="profile-view__avatar">
          <img
            v-if="previewUrl || member.profile?.avatarUrl"
            :src="previewUrl || member.profile?.avatarUrl || ''"
            alt="会员头像"
            data-testid="profile-avatar-img"
          />
          <span v-else class="profile-view__avatar-placeholder" data-testid="profile-avatar-empty">
            暂无头像
          </span>
        </div>
        <div class="profile-view__avatar-actions">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            class="profile-view__avatar-input"
            data-testid="profile-avatar-input"
            :disabled="uploading"
            @change="pickAvatar"
          />
          <p class="profile-view__avatar-tip">{{ avatarLimitLabel }}</p>
          <p
            v-if="uploading"
            class="profile-view__avatar-uploading"
            data-testid="profile-avatar-uploading"
          >
            上传中…
          </p>
          <p
            v-else-if="avatarMessage"
            class="profile-view__avatar-message"
            :class="`profile-view__avatar-message--${avatarMessageType}`"
            data-testid="profile-avatar-message"
          >
            {{ avatarMessage }}
          </p>
        </div>
      </div>

      <form class="profile-view__form" @submit.prevent="submit">
        <label class="profile-view__field profile-view__field--readonly">
          <span>用户名</span>
          <input :value="member.profile?.username ?? ''" type="text" disabled />
        </label>

        <label class="profile-view__field">
          <span>昵称</span>
          <input v-model="form.nickname" type="text" maxlength="32" data-testid="profile-nickname" />
          <small v-if="fieldErrors.nickname" class="profile-view__field-error">{{
            fieldErrors.nickname
          }}</small>
        </label>

        <label class="profile-view__field">
          <span>性别</span>
          <select v-model="form.gender" data-testid="profile-gender">
            <option value="UNKNOWN">保密</option>
            <option value="MALE">男</option>
            <option value="FEMALE">女</option>
          </select>
          <small v-if="fieldErrors.gender" class="profile-view__field-error">{{
            fieldErrors.gender
          }}</small>
        </label>

        <label class="profile-view__field">
          <span>手机号</span>
          <input v-model="form.phone" type="tel" maxlength="20" data-testid="profile-phone" />
          <small v-if="fieldErrors.phone" class="profile-view__field-error">{{
            fieldErrors.phone
          }}</small>
        </label>

        <label class="profile-view__field">
          <span>邮箱</span>
          <input v-model="form.email" type="email" maxlength="128" data-testid="profile-email" />
          <small v-if="fieldErrors.email" class="profile-view__field-error">{{
            fieldErrors.email
          }}</small>
        </label>

        <p
          v-if="formMessage"
          class="profile-view__form-message"
          :class="`profile-view__form-message--${formMessageType}`"
          data-testid="profile-form-message"
        >
          {{ formMessage }}
        </p>

        <button
          type="submit"
          class="profile-view__submit"
          :disabled="saving"
          data-testid="profile-submit"
        >
          {{ saving ? '保存中…' : '保存' }}
        </button>
      </form>
    </template>
  </section>
</template>

<style scoped>
.profile-view {
  max-width: 560px;
  margin: 0 auto;
}

.profile-view__title {
  margin: 0 0 20px;
  font-size: 20px;
}

.profile-view__loading,
.profile-view__error {
  font-size: 14px;
}

.profile-view__error {
  color: #dc2626;
}

.profile-view__avatar-block {
  display: flex;
  gap: 20px;
  align-items: center;
  padding: 16px;
  margin-bottom: 20px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.profile-view__avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 96px;
  height: 96px;
  overflow: hidden;
  background: #f3f4f6;
  border-radius: 50%;
}

.profile-view__avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-view__avatar-placeholder {
  color: #9ca3af;
  font-size: 12px;
}

.profile-view__avatar-actions {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
}

.profile-view__avatar-tip {
  margin: 0;
  color: #6b7280;
}

.profile-view__avatar-uploading {
  margin: 0;
  color: #2563eb;
}

.profile-view__avatar-message {
  margin: 0;
}

.profile-view__avatar-message--success {
  color: #16a34a;
}

.profile-view__avatar-message--error {
  color: #dc2626;
}

.profile-view__form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.profile-view__field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 14px;
}

.profile-view__field input,
.profile-view__field select {
  padding: 8px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
}

.profile-view__field--readonly input {
  color: #6b7280;
  background: #f9fafb;
}

.profile-view__field-error {
  color: #dc2626;
  font-size: 12px;
}

.profile-view__form-message {
  margin: 0;
  font-size: 13px;
}

.profile-view__form-message--success {
  color: #2563eb;
}

.profile-view__form-message--error {
  color: #dc2626;
}

.profile-view__submit {
  align-self: flex-start;
  padding: 8px 24px;
  color: #fff;
  background: #2563eb;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.profile-view__submit:disabled {
  opacity: 0.6;
  cursor: wait;
}
</style>
