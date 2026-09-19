<template>
  <div class="image-uploader">
    <!-- 自定义上传：不写 action，统一走 http-request → 项目唯一 HTTP 出口 -->
    <el-upload
      :show-file-list="false"
      accept="image/jpeg,image/png,image/webp"
      :http-request="doUpload"
    >
      <el-button
        :loading="uploading"
        :disabled="uploading"
      >
        {{ uploading ? '上传中…' : '上传图片' }}
      </el-button>
    </el-upload>
    <el-image
      v-if="modelValue"
      :src="modelValue"
      fit="contain"
      class="image-preview"
      :preview-src-list="[modelValue]"
      preview-teleported
    >
      <template #error>
        <el-icon class="image-fallback">
          <PictureFilled />
        </el-icon>
      </template>
    </el-image>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { UploadRequestOptions } from 'element-plus'
import { PictureFilled } from '@element-plus/icons-vue'
import { uploadProductImage } from '@/api/product/image'
import type { ProductImageScene } from '@/api/product/image'
import { validateImageFile } from './image-validate'

const props = withDefaults(
  defineProps<{
    /** 当前图片地址，支持 v-model */
    modelValue: string
    /** 上传场景：品牌图或商品图 */
    scene: ProductImageScene
    /** 允许的最大体积（MB），默认 2MB */
    maxSizeMb?: number
  }>(),
  {
    maxSizeMb: 2,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
  /** 上传成功事件，载荷为新图片地址 */
  uploaded: [url: string]
}>()

const uploading = ref(false)

async function doUpload(options: UploadRequestOptions): Promise<void> {
  const file = options.file
  const validation = validateImageFile(file, props.maxSizeMb)
  if (!validation.ok) {
    if (validation.reason === 'empty') {
      ElMessage.warning('请选择图片文件')
    } else if (validation.reason === 'type') {
      ElMessage.warning('仅支持 jpg/png/webp 格式')
    } else {
      ElMessage.warning(`图片大小不能超过 ${props.maxSizeMb}MB`)
    }
    return
  }

  uploading.value = true
  try {
    const { url } = await uploadProductImage(props.scene, file)
    emit('update:modelValue', url)
    emit('uploaded', url)
    ElMessage.success('上传成功')
  } catch {
    // 错误文案由 http 拦截器统一提示；失败时保留已有 modelValue，绝不清空
  } finally {
    uploading.value = false
  }
}
</script>

<style scoped>
.image-uploader {
  display: flex;
  align-items: center;
  gap: 8px;
}

.image-preview {
  width: 96px;
  height: 96px;
  border-radius: 4px;
  border: 1px solid var(--el-border-color-lighter);
}

.image-fallback {
  font-size: 24px;
  color: var(--el-text-color-placeholder);
}
</style>
