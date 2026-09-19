import { describe, expect, it } from 'vitest'
import brandViewSource from './BrandListView.vue?raw'
import assetsEditorSource from './ProductAssetsEditor.vue?raw'

/**
 * 图片上传接入两个既有页面的集成契约守卫（DU-FE-704）。
 *
 * 仓库无 DOM 测试环境，沿用 security-controls.spec.ts 的 SFC 源码字符串断言惯例：
 * 原有可手填的 URL 输入框必须保留，上传组件以正确的 scene 与 v-model 接线接入。
 */
describe('BrandListView 品牌 Logo 上传接线', () => {
  it('保留 Logo 的 el-input，并以 scene=BRAND 的 ImageUploader 双向绑定 form.logo', () => {
    expect(brandViewSource).toContain('v-model="form.logo"')
    expect(brandViewSource).toContain('<ImageUploader')
    expect(brandViewSource).toContain('v-model="form.logo" scene="BRAND"')
    expect(brandViewSource).toContain("'./components/ImageUploader.vue'")
  })
})

describe('ProductAssetsEditor 商品图片上传接线', () => {
  it('保留 objectKey 与 imageUrl 两个 el-input', () => {
    expect(assetsEditorSource).toContain('v-model="image.objectKey"')
    expect(assetsEditorSource).toContain('v-model="image.imageUrl"')
  })

  it('以 scene=PRODUCT 的 ImageUploader 更新 image.imageUrl（单向 props + update 事件）', () => {
    expect(assetsEditorSource).toContain('<ImageUploader')
    expect(assetsEditorSource).toContain(':model-value="image.imageUrl"')
    expect(assetsEditorSource).toContain('scene="PRODUCT"')
    expect(assetsEditorSource).toContain('@update:model-value="image.imageUrl = $event"')
  })
})
