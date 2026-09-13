# Red-Green Evidence — DU-FE-302

| 阶段 | 证据 | 结果 |
|---|---|---|
| Red 1 | el-image `preview-src-list` 漏写绑定前缀被当静态字符串，vue-tsc TS2322（string 不可赋 string[]） | failed |
| Fix 1 | 改为 `:preview-src-list="[...]"` | fixed |
| Red 2 | 表单校验使用 `new URL()`，ESLint no-undef：'URL' is not defined（flat config 未声明浏览器全局） | failed |
| Fix 2 | 改为 `/^https?:\/\/\S+$/` 形态初筛，后端聚合保留严格 URI 终验 | fixed |
| Red 3 | 新页面 58 条 vue/max-attributes-per-line 等格式 warning | warning |
| Fix 3 | eslint --fix 新文件，全仓回到 67 warning / 0 error（基线 66，+1 为不可自动修复的既有风格项） | fixed |
| Green | pnpm test 28 passed、type-check 0 error、lint 0 error、build 成功 | passed |
