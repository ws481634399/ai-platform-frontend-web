# Red-Green Evidence — DU-FE-301

| 阶段 | 证据 | 结果 |
|---|---|---|
| Red | category.spec.ts 首跑：vi.mock 工厂引用提升前的 vi.fn 报 "Cannot access 'get' before initialization"；同时 vue-tsc 暴露既有 http.spec.ts 的 axios 类型错误 3 处 | failed |
| Fix | mock 改 vi.hoisted 构造；http.spec.ts config 标注为 InternalAxiosRequestConfig；el-table slot row 三处显式断言 CategoryNode | fixed |
| Green | pnpm test 25 passed（新增 3 例：tree/create/update+status 端点与解包）；type-check 0 error；lint 0 error；build 成功 | passed |
| Contract | 端点/权限码/UnifyResult 结构与 DU-BE-302 CategoryAdminController、identity V3 种子（component_key=CategoryTree）逐项对齐 | passed |
