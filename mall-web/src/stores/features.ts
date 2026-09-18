import { ref } from 'vue'
import { defineStore } from 'pinia'
import { featuresApi, type PublicFeature } from '@/api/features'

/**
 * 公开功能开关 Store（CHG-0022 FE-504）。
 *
 * - 应用启动时 fire-and-forget 调用 load()，不阻塞首屏渲染；
 * - fail-open：接口失败 / 未加载完成 / 键缺失时 hasFeature 返回 fallback（默认 true），
 *   即「拉不到开关就视为开放」，避免 mall-system 故障导致商城白屏；
 * - 后端开关才是真正的安全边界，前端显隐仅体验层控制。
 */
export const useFeaturesStore = defineStore('features', () => {
  /** key → enabled 映射 */
  const features = ref<Record<string, boolean>>({})
  /** 是否已完成首轮加载（成功或失败均置 true） */
  const loaded = ref(false)

  /** 拉取公开功能开关；失败静默（fail-open），不向上抛错 */
  async function load(): Promise<void> {
    try {
      const list: PublicFeature[] = await featuresApi.getPublicFeatures()
      const map: Record<string, boolean> = {}
      for (const item of list) {
        map[item.key] = item.enabled
      }
      features.value = map
    } catch {
      /* 静默降级：保持空映射，hasFeature 统一走 fallback */
    } finally {
      loaded.value = true
    }
  }

  /**
   * 判断功能是否开放。
   * @param key 开关 key，如 search.enabled / mall.guest-cart.enabled
   * @param fallback 未加载 / 缺键时的回退值，默认 true（fail-open）
   */
  function hasFeature(key: string, fallback = true): boolean {
    if (!loaded.value) return fallback
    return features.value[key] ?? fallback
  }

  return {
    features,
    loaded,
    load,
    hasFeature,
  }
})
