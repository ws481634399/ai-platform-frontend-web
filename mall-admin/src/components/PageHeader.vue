<script setup lang="ts">
// 统一内容页头：返回按钮 + 面包屑。由路由 meta 驱动：
//   meta.back.fallback  无浏览历史时的兜底跳转（如直接粘贴 URL 进入编辑页）
//   meta.breadcrumb     面包屑层级，最后一项为当前页（不可点击）
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'

defineProps<{
  /** 内联模式：用于 header 中作为面包屑展示（无返回按钮、无外边距） */
  inline?: boolean
}>()

const route = useRoute()
const router = useRouter()

const breadcrumb = computed(() => route.meta.breadcrumb ?? [])
const showBack = computed(() => !!(route.meta.back))
// 仅当 meta 声明了返回或面包屑时才在布局中占位
const visible = computed(() => showBack.value || breadcrumb.value.length > 0)

function goBack() {
  // history.state.back 为 null 表示无栈内上一页（新开标签页/直接输入 URL）
  if (globalThis.history.state?.back) {
    router.back()
  } else if (route.meta.back?.fallback) {
    router.push(route.meta.back.fallback)
  }
}
</script>

<template>
  <div
    v-if="visible"
    class="page-header"
    :class="{ 'page-header--inline': inline }"
  >
    <el-button
      v-if="showBack && !inline"
      class="page-header__back"
      :icon="ArrowLeft"
      text
      @click="goBack"
    >
      返回
    </el-button>
    <el-breadcrumb
      v-if="breadcrumb.length"
      separator="/"
      class="page-header__breadcrumb"
    >
      <el-breadcrumb-item
        v-for="(item, index) in breadcrumb"
        :key="`${item.title}-${index}`"
        :to="index < breadcrumb.length - 1 && item.to ? item.to : undefined"
      >
        {{ item.title }}
      </el-breadcrumb-item>
    </el-breadcrumb>
  </div>
</template>

<style scoped>
.page-header {
  display: flex;
  align-items: center;
  gap: var(--admin-space-2);
  margin-bottom: var(--admin-space-4);
}

.page-header--inline {
  margin-bottom: 0;
  min-width: 0;
  flex: 1;
  overflow: hidden;
}

.page-header__breadcrumb {
  min-width: 0;
  overflow: hidden;
  flex: 1;
}

.page-header__back {
  margin-left: -8px;
  font-size: 14px;
  font-weight: 500;
}
</style>
