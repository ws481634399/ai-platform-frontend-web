import { createApp } from 'vue'

import App from './App.vue'
import { router } from './router'
import { pinia } from './stores'
import { useFeaturesStore } from './stores/features'

// 全局 Design Token（color / spacing / radius / shadow / typography / transition）
// CHG-0023 UI 升级：自托管显示字体 Sora（拉丁）+ Noto Sans SC（中文），零 CDN 依赖
import '@fontsource-variable/sora'
import '@fontsource/noto-sans-sc/400.css'
import '@fontsource/noto-sans-sc/500.css'
import '@fontsource/noto-sans-sc/700.css'
import '@fontsource/noto-sans-sc/900.css'
import './styles/tokens.css'

createApp(App).use(router).use(pinia).mount('#app')

// 公开功能开关：挂载后 fire-and-forget 加载，不阻塞首屏渲染；
// 接口失败在 store 内静默（fail-open），此处不捕获也不等待。
void useFeaturesStore(pinia).load()
