# DU Task Spec — DU-FE-002

> 层级：实现仓（Repository）侧产物——Expected Implementation 之"做什么/验收"（DU 契约与验收）。
> 权威 DU 划分：外部 story-design.md §0（SSOT）；本文件只按 DU id DU-FE-002 引用该表，不新造 DU。
> verifies 约定：任务项绑定 TC-NNN（红绿灯对象）；TC 定义在外部对应 Story 的 test-design.md，本文件只引用不新造。

## 0. 元信息

- DU id: DU-FE-002
- Change ID: CHG-0025
- Feature Path: 分布式增强/延迟订单自动取消/延迟取消能力/延迟订单自动取消
- 权威来源: story-design.md §1.10 / DU-FE-002

## 任务清单

- [ ] 任务 1 — distributed.ts 追加：DelayTaskStatus/DelayTaskView 类型 + delayTaskApi.page（status/page/size）/cancel（POST，reason?）（verifies: TC-009）
- [ ] 任务 2 — DelayTaskListView.vue：状态筛选（待取消/已取消/失败）+ 表格（orderNo/状态 Tag/创建时间/取消时间/最近错误）+ 分页/空态/加载态（verifies: TC-009）
- [ ] 任务 3 — 手动取消交互：仅 PENDING 行显示按钮，el-popconfirm 二次确认，v-permission="'order-delay:cancel'"，成功提示并刷新（verifies: TC-009）
- [ ] 任务 4 — component-registry 注册 DelayTaskList（对齐 V14 菜单种子 component_key）（verifies: TC-009）
- [ ] 任务 5 — 全量回归 vitest run（既有页面/路由/权限用例零回退）（verifies: TC-010）

## Acceptance Criteria

- [ ] AC-032 — mall-admin 可查询延迟取消任务（PENDING/CANCELLED/FAILED 筛选分页）并手动触发取消；按钮受权限码控制；操作结果与审计由后端记录，前端展示成功/失败反馈

## 执行顺序（Execution Order）

1 → 2 → 3 → 4 → 5（任务 2/3 同一视图可连续提交）

## 并行度（Parallelization）

无（API 封装先行，视图与注册表随后，回归收口）

## Verification

- Unit: `pnpm --filter mall-admin test`（vitest run）——api 封装与视图交互逻辑单测
- Integration: N/A（手动取消端到端归 M7 Integration Gate）
- API: delayTaskApi URL/参数/解包单测
- Error Case: 取消失败时错误文案经拦截器统一提示、列表状态不变
