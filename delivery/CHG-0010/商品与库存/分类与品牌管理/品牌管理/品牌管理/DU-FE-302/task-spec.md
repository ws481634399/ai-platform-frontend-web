# DU Task Spec — DU-FE-302

> 层级：实现仓（Repository）侧产物——Expected Implementation 之"做什么/验收"（DU 契约与验收）。
> 权威 DU 划分：外部 requirement-design.md §6（SSOT）；本文件只按 DU id DU-FE-302 引用该表，不新造 DU。
> 互链：通过 DU id DU-FE-302 与同目录 task-design.md（"怎么做"）配对互链。
> verifies 约定：任务项绑定 TC-NNN（红绿灯对象）；TC 定义在外部对应 Story 的 test-design.md，本文件只引用不新造。

## 0. 元信息

- DU id: DU-FE-302
- Change ID: CHG-0010
- Feature Path: 商品与库存/分类与品牌管理/品牌管理/品牌管理
- 权威来源: requirement-design.md §6 / DU-FE-302

## 任务清单

- [ ] 任务 1 — 新增 src/api/product/brand.ts：BrandItem/BrandQuery/SaveBrandPayload 类型与 page/get/create/update/changeStatus 五个方法（verifies: TC-008）
- [ ] 任务 2 — 新增 src/views/product/BrandListView.vue：查询区（keyword/status）、分页表格（Logo 缩略、状态 tag、sort,id 次序展示）、el-pagination 翻页（verifies: TC-008）
- [ ] 任务 3 — 新增/编辑弹窗与启停：名称 1..64、Logo URL 形态/长度、描述 ≤255、sort 数字校验；提交后刷新；启停二次确认；服务端同名错误保留输入并提示（verifies: TC-008）
- [ ] 任务 4 — component-registry.ts 登记 BrandList；核对菜单 component_key；操作按钮接 has('product:brand:*') 显隐（verifies: TC-008）
- [ ] 任务 5 — 本地联调与构建：pnpm build 通过；浏览器走查分页/搜索/新增/编辑/启停/权限显隐并留存截图证据（verifies: TC-008）

## Acceptance Criteria

- [ ] AC-008 — 品牌菜单进入后分页展示与后端一致；关键字与状态筛选生效；可新增、编辑（含 Logo URL）、启停并即时刷新；同名等错误中文提示可见且表单可修正重试；无权限按钮不可见；pnpm build 无错误。

## 执行顺序（Execution Order）

1. 任务 1 → 任务 2 → 任务 3 → 任务 4 → 任务 5
2. 前置：DU-BE-303 在联调环境可用（账号具备 product:brand:* 权限）

## 并行度（Parallelization）

无。

## Verification

- Unit: N/A（声明式交互页）。
- Integration: N/A（串联由手工/E2E 覆盖）。
- API: N/A（契约由 DU-BE-303 API 测试保证）。
- Migration: N/A。
- Error Case: 手工验证同名冲突、超长/非法 Logo URL 的前后端提示；无权限按钮不可见。
- Build/E2E: `pnpm build` 成功；浏览器走查截图归档到本 DU 目录 evidence。
