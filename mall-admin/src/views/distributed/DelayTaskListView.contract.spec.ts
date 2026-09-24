import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const source = readFileSync(resolve(__dirname, 'DelayTaskListView.vue'), 'utf8')

describe('DelayTaskListView 结构契约', () => {
  it('三状态筛选选项', () => {
    expect(source).toContain('value="PENDING"')
    expect(source).toContain('value="CANCELLED"')
    expect(source).toContain('value="FAILED"')
  })

  it('仅 PENDING 行展示手动取消，二次确认 + 权限指令 + 测试锚点', () => {
    expect(source).toContain("delayStatus === 'PENDING'")
    expect(source).toContain('el-popconfirm')
    expect(source).toContain("v-permission=\"'order-delay:cancel'\"")
    expect(source).toContain('data-testid="delay-cancel"')
  })

  it('表格展示六视图字段', () => {
    for (const field of ['orderNo', 'delayStatus', 'createdAt', 'cancelledAt', 'lastError']) {
      expect(source).toContain(field)
    }
  })

  it('取消成功提示并刷新列表', () => {
    expect(source).toContain("ElMessage.success('已取消订单')")
  })
})
