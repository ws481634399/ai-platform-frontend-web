import { describe, expect, it } from 'vitest'
import { validateKnowledgeFile } from './knowledge-validate'

describe('validateKnowledgeFile 知识文档前端初筛', () => {
  it('.md/.txt 且体积合法：通过', () => {
    expect(validateKnowledgeFile({ name: 'faq.md', size: 1024 }).ok).toBe(true)
    expect(validateKnowledgeFile({ name: 'policy.txt', size: 2048 }).ok).toBe(true)
    // 扩展名大小写不敏感
    expect(validateKnowledgeFile({ name: 'FAQ.MD', size: 1 }).ok).toBe(true)
  })

  it('null/空文件：empty', () => {
    const r1 = validateKnowledgeFile(null)
    expect(r1.ok).toBe(false)
    if (!r1.ok) expect(r1.reason).toBe('empty')

    const r2 = validateKnowledgeFile({ name: 'a.md', size: 0 })
    expect(r2.ok).toBe(false)
    if (!r2.ok) expect(r2.reason).toBe('empty')
  })

  it('扩展名不在白名单：type', () => {
    for (const name of ['a.pdf', 'a.docx', 'a', 'a.exe']) {
      const r = validateKnowledgeFile({ name, size: 1 })
      expect(r.ok).toBe(false)
      if (!r.ok) expect(r.reason).toBe('type')
    }
  })

  it('超过 5MB：size（边界 5MB 恰好通过）', () => {
    const fiveMb = 5 * 1024 * 1024
    expect(validateKnowledgeFile({ name: 'a.md', size: fiveMb }).ok).toBe(true)
    const r = validateKnowledgeFile({ name: 'a.txt', size: fiveMb + 1 })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toBe('size')
  })
})
