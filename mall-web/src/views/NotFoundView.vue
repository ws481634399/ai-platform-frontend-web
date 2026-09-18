<template>
  <section class="not-found-view">
    <p class="not-found-view__code">404</p>
    <h1 class="not-found-view__title">页面不存在</h1>
    <p class="not-found-view__text">你访问的页面可能已被移除或链接有误</p>
    <router-link
      to="/"
      class="not-found-view__action"
    >
      返回首页
    </router-link>
  </section>
</template>

<style scoped>
.not-found-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-16) var(--space-4);
  text-align: center;
}
.not-found-view__code {
  margin: 0 0 var(--space-2);
  font-size: var(--text-4xl);
  font-weight: 700;
  color: var(--color-text);
  letter-spacing: var(--tracking-tight);
  font-variant-numeric: tabular-nums;
}
.not-found-view__title {
  margin: 0 0 var(--space-2);
  font-size: var(--text-xl);
  font-weight: 600;
  color: var(--color-text);
}
.not-found-view__text {
  margin: 0 0 var(--space-5);
  color: var(--color-text-tertiary);
  font-size: var(--text-sm);
}
.not-found-view__action {
  display: inline-block;
  padding: var(--space-3) var(--space-6);
  border: 1px solid var(--color-text);
  border-radius: var(--radius-md);
  color: var(--color-text);
  font-size: var(--text-sm);
  font-weight: 500;
  transition: all var(--transition-fast);
}
.not-found-view__action:hover {
  background: var(--color-primary);
  color: var(--color-text-on-primary);
  border-color: var(--color-primary);
}
</style>
