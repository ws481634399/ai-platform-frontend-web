import { describe, expect, it } from 'vitest'
import source from './ImageUploader.vue?raw'

/**
 * ImageUploader 组件契约守卫（CHG-0023 STORY-007-01-01-02，DU-FE-704）。
 *
 * 仓库未引入 @vue/test-utils/DOM 环境，视图测试沿用 security-controls.spec.ts
 * 的 SFC 源码字符串断言惯例，保证上传接线不被改坏。
 */
describe('ImageUploader.vue 源码契约', () => {
  it('声明 modelValue/scene/maxSizeMb 三个 props 与两个约定 emits', () => {
    expect(source).toContain('modelValue')
    expect(source).toContain('scene')
    expect(source).toContain('maxSizeMb')
    expect(source).toContain("'update:modelValue'")
    expect(source).toContain("'uploaded'")
  })

  it('el-upload 限定三种图片 mime，且走自定义 http-request（禁止 action 直传）', () => {
    expect(source).toContain('accept="image/jpeg,image/png,image/webp"')
    expect(source).toContain(':http-request="doUpload"')
    expect(source).toContain(':show-file-list="false"')
    // 不得出现 action 属性（含 action="..." 或 :action=）
    expect(source).not.toMatch(/\s:?action=/)
  })

  it('接线图片上传 API 与本地文件校验逻辑', () => {
    expect(source).toContain('uploadProductImage')
    expect(source).toContain('validateImageFile')
  })

  it('上传成功后回填地址并提供 el-image 预览（含失败兜底图标）', () => {
    expect(source).toContain("emit('update:modelValue'")
    expect(source).toContain("emit('uploaded'")
    expect(source).toContain('<el-image')
    expect(source).toContain(':preview-src-list="[modelValue]"')
    expect(source).toContain('PictureFilled')
  })
})
