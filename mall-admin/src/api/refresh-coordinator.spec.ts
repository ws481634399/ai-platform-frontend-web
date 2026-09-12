import { describe, expect, it } from 'vitest'
import { coordinateRefresh } from './refresh-coordinator'

describe('coordinateRefresh', () => {
  it('STORY-001-03-03-02/TC-001 shares one refresh across concurrent 401 responses', async () => {
    let calls = 0
    const refresh = async () => { calls += 1; await Promise.resolve(); return 'token' }
    const [first, second] = await Promise.all([coordinateRefresh(refresh), coordinateRefresh(refresh)])
    expect([first, second]).toEqual(['token', 'token'])
    expect(calls).toBe(1)
  })

  it('STORY-001-03-03-02/TC-002..003 rejects waiters, resets single-flight, and prevents recursive reuse', async () => {
    await expect(coordinateRefresh(async () => { throw new Error('expired') })).rejects.toThrow('expired')
    await expect(coordinateRefresh(async () => 'new-token')).resolves.toBe('new-token')
  })
})
