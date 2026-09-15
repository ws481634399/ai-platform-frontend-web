/**
 * 单飞刷新协调器（移植 mall-admin refresh-coordinator 模式，CHG-0016 / DU-FE-601）。
 *
 * 并发 401 只允许一次 /refresh：首个调用创建 inflight Promise，其余调用共享同一
 * Promise 后重放各自原请求；刷新失败时由协调器执行唯一一次集中清会话，随后单飞
 * 复位，后续导航可重新触发登录流程。
 */
let activeRefresh: Promise<string> | undefined

export function coordinateRefresh(refresh: () => Promise<string>): Promise<string> {
  if (!activeRefresh) {
    activeRefresh = refresh()
      .catch(async (error) => {
        if (typeof window !== 'undefined') {
          const { clearSession } = await import('@/auth/clear-session')
          const { router } = await import('@/router')
          await clearSession(router)
        }
        throw error
      })
      .finally(() => {
        activeRefresh = undefined
      })
  }
  return activeRefresh
}
