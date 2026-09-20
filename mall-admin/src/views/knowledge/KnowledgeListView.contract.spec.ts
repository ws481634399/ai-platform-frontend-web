import { describe, expect, it } from 'vitest'
import source from './KnowledgeListView.vue?raw'

/**
 * KnowledgeListView.vue 源码契约守卫（CHG-0024 STORY-008-03-01，DU-FE-003）。
 *
 * 仓库未引入 @vue/test-utils/DOM 环境，沿用 SFC 源码字符串断言惯例，
 * 保证五端点接线与权限码不被改坏。
 */
describe('KnowledgeListView.vue 源码契约', () => {
  it('上传走自定义 http-request，限定 .md/.txt（禁止 action 直传）', () => {
    expect(source).toContain('accept=".md,.txt"')
    expect(source).toContain(':http-request="doUpload"')
    expect(source).toContain(':show-file-list="false"')
    expect(source).not.toMatch(/\s:?action=/)
  })

  it('接线五端点 API 与本地文件校验', () => {
    expect(source).toContain('knowledgeApi.list()')
    expect(source).toContain('knowledgeApi.upload')
    expect(source).toContain('knowledgeApi.setEnabled')
    expect(source).toContain('knowledgeApi.remove')
    expect(source).toContain('knowledgeApi.rebuild')
    expect(source).toContain('validateKnowledgeFile')
  })

  it('四种处理状态徽标 + FAILED 失败原因列', () => {
    expect(source).toContain("PENDING: '待处理'")
    expect(source).toContain("PROCESSING: '处理中'")
    expect(source).toContain("COMPLETED: '已完成'")
    expect(source).toContain("FAILED: '失败'")
    expect(source).toContain('failReason')
  })

  it('操作按钮挂 V12 权限码 ai:knowledge:*', () => {
    expect(source).toContain(`v-permission="'ai:knowledge:upload'"`)
    expect(source).toContain("'ai:knowledge:update'")
    expect(source).toContain("'ai:knowledge:delete'")
    expect(source).toContain("'ai:knowledge:rebuild'")
  })

  it('删除二次确认（el-popconfirm），启停 switch 透传布尔值', () => {
    expect(source).toContain('el-popconfirm')
    expect(source).toContain('data-testid="knowledge-enabled-switch"')
    expect(source).toContain('toggleEnabled')
  })
})
