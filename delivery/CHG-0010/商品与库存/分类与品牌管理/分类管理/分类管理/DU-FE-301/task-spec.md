# DU Task Spec — DU-FE-301

> 层级：实现仓（Repository）侧产物——Expected Implementation 之"做什么/验收"（DU 契约与验收）。
> 权威 DU 划分：外部 requirement-design.md §6（SSOT）；本文件只按 DU id DU-FE-301 引用该表，不新造 DU。
> 互链：通过 DU id DU-FE-301 与同目录 task-design.md（"怎么做"）配对互链。
> verifies 约定：任务项绑定 TC-NNN（红绿灯对象）；TC 定义在外部对应 Story 的 test-design.md，本文件只引用不新造。

## 0. 元信息

- DU id: DU-FE-301
- Change ID: CHG-0010
- Feature Path: 商品与库存/分类与品牌管理/分类管理/分类管理
- 权威来源: requirement-design.md §6 / DU-FE-301

## 任务清单

- [ ] 任务 1 — 新增 src/api/product/category.ts：CategoryNode 等类型与 tree/get/create/update/changeStatus 五个方法，复用 http 实例（verifies: TC-011）
- [ ] 任务 2 — 新增 src/views/product/CategoryTreeView.vue：树表加载渲染（含禁用置灰与 status tag）、新增根/新增子级（预填 parentId）、编辑弹窗（名称 1..32、sort 数字校验）、启停确认、成功刷新与错误提示（verifies: TC-011）
- [ ] 任务 3 — component-registry.ts 登记 CategoryTree；核对菜单 component_key 与之一致；操作按钮接 has('product:category:*') 显隐（verifies: TC-011）
- [ ] 任务 4 — 本地联调验证与构建：pnpm build 通过；浏览器走查树渲染/新增/编辑/启停/权限显隐并留存截图证据（verifies: TC-011）

## Acceptance Criteria

- [ ] AC-011 — 分类管理菜单进入后树结构与后端 tree 一致；可新增根与子级、编辑名称/排序、启停并即时刷新；禁用节点置灰可见；无权限用户看不到/点不到对应按钮；pnpm build 无错误。

## 执行顺序（Execution Order）

1. 任务 1 → 任务 2 → 任务 3 → 任务 4
2. 前置：DU-BE-302 已在联调环境可用（含权限种子，登录账号具备 product:category:* 权限）

## 并行度（Parallelization）

无（单页面串行开发）。

## Verification

- Unit: N/A（纯交互页，无独立可测逻辑单元；表单校验为 Element Plus 声明式）。
- Integration: N/A（前后端串联在 E2E/手工验证覆盖）。
- API: N/A（契约符合性由 DU-BE-302 API 测试保证；前端只做薄封装）。
- Migration: N/A。
- Error Case: 手工验证同名/超层级/禁用父等服务端业务错误的中文提示展示；无权限按钮不可见。
- Build/E2E: `pnpm build` 成功；浏览器走查截图作为 evidence 归档到本 DU 目录。
