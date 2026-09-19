<template>
  <el-card shadow="never">
    <template #header>
      <ProductSectionTitle title="商品图片" hint="有图片时必须且只能指定一张主图">
        <el-button :icon="Plus" @click="addImage">添加图片</el-button>
      </ProductSectionTitle>
    </template>
    <el-empty v-if="images.length === 0" description="暂未添加商品图片" :image-size="64" />
    <el-radio-group v-else v-model="mainImageIndex" class="editor-list">
      <div v-for="(image, index) in images" :key="index" class="editor-row image-row">
        <el-radio :value="index">主图</el-radio>
        <el-input v-model="image.objectKey" placeholder="对象存储 Key" />
        <!-- CHG-0023：图片地址可手填，也可上传商品图后自动回填 -->
        <div class="image-url-cell">
          <el-input v-model="image.imageUrl" placeholder="https://... 图片地址" />
          <ImageUploader
            :model-value="image.imageUrl"
            scene="PRODUCT"
            @update:model-value="image.imageUrl = $event"
          />
        </div>
        <el-select v-model="image.imageType" class="image-type">
          <el-option label="展示图" value="GALLERY" />
          <el-option label="详情图" value="DETAIL" />
          <el-option label="SKU 图" value="SKU" />
        </el-select>
        <el-button link type="danger" @click="removeImage(index)">删除</el-button>
      </div>
    </el-radio-group>
  </el-card>

  <el-card shadow="never">
    <template #header>
      <ProductSectionTitle title="商品属性" hint="例如材质、产地、保修期等非销售规格">
        <el-button :icon="Plus" @click="addAttribute">添加属性</el-button>
      </ProductSectionTitle>
    </template>
    <el-empty v-if="attributes.length === 0" description="暂未添加商品属性" :image-size="64" />
    <div v-else class="editor-list">
      <div v-for="(attribute, index) in attributes" :key="index" class="editor-row attribute-row">
        <el-input v-model="attribute.name" placeholder="属性名，如材质" />
        <el-input v-model="attribute.value" placeholder="属性值，如铝合金" />
        <el-input-number v-model="attribute.sortOrder" :min="0" controls-position="right" />
        <el-button link type="danger" @click="attributes.splice(index, 1)">删除</el-button>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { Plus } from '@element-plus/icons-vue'
import type { AttributePayload, ImagePayload } from '@/api/product/product'
import ProductSectionTitle from './ProductSectionTitle.vue'
import ImageUploader from './components/ImageUploader.vue'

const images = defineModel<ImagePayload[]>('images', { required: true })
const attributes = defineModel<AttributePayload[]>('attributes', { required: true })
const mainImageIndex = defineModel<number>('mainImageIndex', { required: true })

function addImage(): void {
  images.value.push({
    objectKey: '',
    imageUrl: '',
    imageType: 'GALLERY',
    sortOrder: images.value.length,
    mainFlag: false,
  })
  if (mainImageIndex.value < 0) mainImageIndex.value = 0
}

function removeImage(index: number): void {
  images.value.splice(index, 1)
  if (!images.value.length) mainImageIndex.value = -1
  else if (mainImageIndex.value === index) mainImageIndex.value = 0
  else if (mainImageIndex.value > index) mainImageIndex.value -= 1
}

function addAttribute(): void {
  attributes.value.push({ name: '', value: '', sortOrder: attributes.value.length })
}
</script>

<style scoped>
.editor-list { display: flex; width: 100%; flex-direction: column; gap: 10px; }
.editor-row { display: grid; align-items: center; gap: 10px; padding: 12px;
  border: 1px solid var(--el-border-color-lighter); border-radius: 6px; background: var(--el-fill-color-extra-light); }
.image-row { grid-template-columns: 68px minmax(140px, .8fr) minmax(260px, 1.5fr) 110px 48px; }
.attribute-row { grid-template-columns: minmax(180px, .8fr) minmax(250px, 1.4fr) 130px 48px; }
.image-type { width: 110px; }
/* 图片地址列：输入框与上传组件纵向紧凑排布 */
.image-url-cell { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
</style>
