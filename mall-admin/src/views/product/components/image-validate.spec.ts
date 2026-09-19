import { describe, expect, it } from 'vitest'
import { validateImageFile } from './image-validate'

describe('validateImageFile', () => {
  it('合法 jpg/jpeg/png/webp 文件通过（扩展名大小写不敏感）', () => {
    expect(validateImageFile({ name: 'a.jpg', size: 1024 })).toEqual({ ok: true })
    expect(validateImageFile({ name: 'a.JPEG', size: 1024 })).toEqual({ ok: true })
    expect(validateImageFile({ name: 'a.png', size: 2 * 1024 * 1024 })).toEqual({ ok: true })
    expect(validateImageFile({ name: 'a.webp', size: 1 })).toEqual({ ok: true })
  })

  it('无扩展名 / gif / exe 拒绝为 type', () => {
    expect(validateImageFile({ name: 'noext', size: 100 })).toEqual({ ok: false, reason: 'type' })
    expect(validateImageFile({ name: 'a.gif', size: 100 })).toEqual({ ok: false, reason: 'type' })
    expect(validateImageFile({ name: 'a.exe', size: 100 })).toEqual({ ok: false, reason: 'type' })
  })

  it('2MB + 1 字节拒绝为 size（边界值）', () => {
    expect(validateImageFile({ name: 'a.jpg', size: 2 * 1024 * 1024 + 1 })).toEqual({
      ok: false,
      reason: 'size',
    })
  })

  it('空文件与 null/undefined 拒绝为 empty', () => {
    expect(validateImageFile({ name: 'a.jpg', size: 0 })).toEqual({ ok: false, reason: 'empty' })
    expect(validateImageFile(null)).toEqual({ ok: false, reason: 'empty' })
    expect(validateImageFile(undefined)).toEqual({ ok: false, reason: 'empty' })
  })

  it('maxSizeMb 自定义生效', () => {
    // 上限 1MB 时，1MB 边界内通过、超出 1 字节拒绝
    expect(validateImageFile({ name: 'a.png', size: 1 * 1024 * 1024 }, 1)).toEqual({ ok: true })
    expect(validateImageFile({ name: 'a.png', size: 1 * 1024 * 1024 + 1 }, 1)).toEqual({
      ok: false,
      reason: 'size',
    })
    // 放宽到 5MB 时，2MB+1 字节的文件不再拒绝
    expect(validateImageFile({ name: 'a.png', size: 2 * 1024 * 1024 + 1 }, 5)).toEqual({ ok: true })
  })
})
