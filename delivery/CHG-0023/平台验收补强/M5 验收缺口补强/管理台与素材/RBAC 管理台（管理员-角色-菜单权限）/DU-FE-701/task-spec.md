# DU Task Spec — DU-FE-701

> 权威 DU 划分：外部 story-design.md §5；TC 定义在外部 Story test-design.md，本文件只引用。

## 0. 元信息

- DU id: DU-FE-701
- Change ID: CHG-0023
- Feature Path: 平台验收补强/M5 验收缺口补强/管理台与素材/RBAC 管理台（管理员-角色-菜单权限）
- 权威来源: story-design.md §5 / DU-FE-701

## 任务清单

- [ ] 任务 1 — 新建 src/api/security.ts，封装 admins（分页/创建/状态/密码/角色替换）、roles（CRUD）、menus/permissions 查询、role-authorizations 替换；TS 类型按 RbacAdministrationApplicationService 与 AdminUserApplicationService 实际 view 记录核对建模（verifies: TC-001, TC-005, TC-007）
- [ ] 任务 2 — 新建 stores/security.ts：admins 分页状态/加载、roles/menus/permissions 加载、当前页过滤 computed（verifies: TC-002, TC-003）
- [ ] 任务 3 — AdminUserListView.vue：分页表格+本地过滤、新建对话框（成功后引导分配角色）、启停、重置密码二次确认、分配角色对话框（提交裸数组）（verifies: TC-004, TC-005, TC-006）
- [ ] 任务 4 — RoleListView.vue：角色 CRUD；权限分配抽屉（菜单树+权限点勾选、编辑回显、提交 targetId/permissionIds/menuIds）（verifies: TC-007, TC-008）
- [ ] 任务 5 — MenuTreeView.vue：菜单+权限点只读树（verifies: TC-009）
- [ ] 任务 6 — component-registry 注册三组件、/security/** 路由与权限指令 v-permission 接线（verifies: TC-010）
- [ ] 任务 7 — 新增 api/store/视图 vitest 用例（TC-001~10）并跑通全量门禁（verifies: TC-001, TC-002, TC-003, TC-004, TC-005, TC-006, TC-007, TC-008, TC-009, TC-010, TC-012）

## Acceptance Criteria

- [ ] AC-001 — 打开管理员页时按 page/size 拉取并渲染分页表格；本地过滤只改变当前页显示且不发额外请求；未持 admin:read 时入口不可见（给定无权限菜单当渲染则无该路由）
- [ ] AC-002 — 当提交新建管理员则 POST 两字段、成功刷新；当 409 则显示后端 message 且对话框保留；分配角色发出裸 JSON 数组；启停/重置密码载荷正确且重置有二次确认
- [ ] AC-003 — 角色新建/编辑/删除可用；打开授权抽屉回显已勾选项，保存经 /role-authorizations 全量提交并在成功后重载
- [ ] AC-004 — 菜单权限页只读渲染菜单层级与 permissionCode，无任何编辑控件
- [ ] AC-005 — 无权限码时受控节点不渲染；pnpm vitest 全绿且数量净增、type-check/lint/build 全绿

## 执行顺序（Execution Order）

1. 任务 1 → 2 → 3/4/5（可并行）→ 6 → 7

## 并行度（Parallelization）

任务 3、4、5 在 api/store 就绪后可并行。

## Verification

- Unit: src/api/security.spec.ts、stores/security.spec.ts、views/security/*.spec.vue；命令 `pnpm -C mall-admin test`
- Integration: N/A（前端组件级；真实登录联调属 C 类）
- API: api spec 断言 URL/方法/请求体（含裸数组与 role-authorizations 复合体）
- Migration: N/A
- Error Case: TC-004 覆盖 409 提示与对话框保留；store 加载失败 message
- 全量门禁: `pnpm -C mall-admin test`、type-check、lint、build（基线用例 47，只许净增）
