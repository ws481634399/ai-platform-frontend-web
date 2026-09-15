import { describe, expect, it } from 'vitest'
import { coordinateRefresh } from './refresh-coordinator'

describe('coordinateRefresh（会员单飞刷新，STORY-003-01-01-02/TC-009）', () => {
  it('并发刷新共享同一个 Promise，refresh 仅执行一次', async () => {
    let calls = 0
    const refresh = async () => {
      calls += 1
      await Promise.resolve()
      return 'new-access'
    }
    const [first, second] = await Promise.all([coordinateRefresh(refresh), coordinateRefresh(refresh)])
    expect([first, second]).toEqual(['new-access', 'new-access'])
    expect(calls).toBe(1)
  })

  it('刷新失败后单飞复位：等待者同失败，后续调用可重新触发', async () => {
    await expect(
      coordinateRefresh(async () => {
        throw new Error('refresh expired')
      }),
    ).rejects.toThrow('refresh expired')
    await expect(coordinateRefresh(async () => 'new-access')).resolves.toBe('new-access')
  })
})
