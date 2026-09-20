/** 知识文档校验失败原因：空文件 / 类型不支持 / 体积超限 */
export type KnowledgeInvalidReason = 'empty' | 'type' | 'size'

/** 允许上传的知识文档扩展名（小写白名单，对齐 ai-service：Markdown/TXT） */
const ALLOWED_EXTENSIONS = ['md', 'txt']

export type KnowledgeValidationResult = { ok: true } | { ok: false; reason: KnowledgeInvalidReason }

/**
 * 知识文档上传前的前端初筛（终验以后端魔数/扩展名校验为准）。
 *
 * - null/undefined 或 size===0：empty
 * - 扩展名取 name 最后一个点之后的小写串，须命中 md/txt，否则 type
 * - 体积超过 maxSizeMb（默认 5MB）：size
 */
export function validateKnowledgeFile(
  file: { name: string; size: number } | null | undefined,
  maxSizeMb = 5,
): KnowledgeValidationResult {
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
