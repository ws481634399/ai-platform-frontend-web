import { createApp } from 'vue'

import App from './App.vue'
import { router } from './router'
import { pinia } from './stores'
import { useFeaturesStore } from './stores/features'

// 全局 Design Token（color / spacing / radius / shadow / typography / transition）
import './styles/tokens.css'

createApp(App).use(router).use(pinia).mount('#app')

// 公开功能开关：挂载后 fire-and-forget 加载，不阻塞首屏渲染；
// 接口失败在 store 内静默（fail-open），此处不捕获也不等待。
void useFeaturesStore(pinia).load()
