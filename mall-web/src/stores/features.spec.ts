import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { featuresApi } from '@/api/features'
import { useFeaturesStore } from './features'

vi.mock('@/api/features', () => ({
  featuresApi: {
    getPublicFeatures: vi.fn(),
  },
}))

describe('公开功能开关 Store（CHG-0022 FE-504 fail-open）', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
  })

  it('未加载时 hasFeature 返回 fallback（默认 true，fail-open）', () => {
    const store = useFeaturesStore()
    expect(store.loaded).toBe(false)
    expect(store.hasFeature('search.enabled')).toBe(true)
    expect(store.hasFeature('search.enabled', false)).toBe(false)
  })

  it('load 成功：数组映射为 key→enabled，缺键仍走 fallback', async () => {
    const store = useFeaturesStore()
    vi.mocked(featuresApi.getPublicFeatures).mockResolvedValueOnce([
      { key: 'search.enabled', enabled: false },
      { key: 'mall.guest-cart.enabled', enabled: true },
    ])

    await store.load()

    expect(featuresApi.getPublicFeatures).toHaveBeenCalledOnce()
    expect(store.loaded).toBe(true)
    expect(store.hasFeature('search.enabled')).toBe(false)
    expect(store.hasFeature('mall.guest-cart.enabled')).toBe(true)
    // 缺键：默认 true；显式 fallback=false 时返回 false
    expect(store.hasFeature('unknown.key')).toBe(true)
    expect(store.hasFeature('unknown.key', false)).toBe(false)
  })

  it('load 失败静默吞错：loaded 置位、映射为空、hasFeature fail-open', async () => {
    const store = useFeaturesStore()
    vi.mocked(featuresApi.getPublicFeatures).mockRejectedValueOnce(new Error('503 unavailable'))

    await expect(store.load()).resolves.toBeUndefined()
    expect(store.loaded).toBe(true)
    expect(store.features).toEqual({})
    expect(store.hasFeature('search.enabled')).toBe(true)
    expect(store.hasFeature('mall.guest-cart.enabled', false)).toBe(false)
  })
})
