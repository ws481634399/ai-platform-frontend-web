/** 图片校验失败原因：空文件 / 类型不支持 / 体积超限 */
export type InvalidReason = 'empty' | 'type' | 'size'

/** 允许上传的图片扩展名（小写白名单） */
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp']

export type ImageValidationResult = { ok: true } | { ok: false; reason: InvalidReason }

/**
 * 上传前的图片文件前端初筛（终验以后端为准）。
 *
 * - null/undefined 或 size===0：empty
 * - 扩展名取 name 最后一个点之后的小写串，须命中 jpg/jpeg/png/webp，否则 type
 * - 体积超过 maxSizeMb（默认 2MB）：size
 */
export function validateImageFile(
  file: { name: string; size: number } | null | undefined,
  maxSizeMb = 2,
): ImageValidationResult {
  if (!file || file.size === 0) {
    return { ok: false, reason: 'empty' }
  }

  const dotIndex = file.name.lastIndexOf('.')
  const extension = dotIndex >= 0 ? file.name.slice(dotIndex + 1).toLowerCase() : ''
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return { ok: false, reason: 'type' }
  }

  if (file.size > maxSizeMb * 1024 * 1024) {
    return { ok: false, reason: 'size' }
  }

  return { ok: true }
}
