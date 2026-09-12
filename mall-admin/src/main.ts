import { createApp } from 'vue'

import App from './App.vue'
import { router } from './router'
import { pinia } from './stores'
import { permissionDirective } from './directives/permission'

// Element Plus 组件经 unplugin 按需自动导入，不全局注册
createApp(App).use(pinia).use(router).directive('permission', permissionDirective).mount('#app')
