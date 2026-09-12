let activeRefresh: Promise<string> | undefined

export function coordinateRefresh(refresh: () => Promise<string>): Promise<string> {
  if (!activeRefresh) activeRefresh = refresh()
    .catch(async (error) => {
      if (typeof window !== 'undefined') {
        const { clearSession } = await import('@/auth/clear-session')
        const { router } = await import('@/router')
        await clearSession(router)
      }
      throw error
    })
    .finally(() => { activeRefresh = undefined })
  return activeRefresh
}
