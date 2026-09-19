# DU Task Design — DU-FE-701

## 1. Goal

交付 mall-admin RBAC 三管理页及其 api/store/路由/权限接线，对接 identity 既有 /api/admin/security/** 端点，不新增后端能力。职责以 story-design.md §5 DU-FE-701 为界。

## 2. Repository

repo-2（ai-platform-frontend/mall-admin）。

## 3. Scope

- Target Modules：mall-admin/src/api、src/stores、src/views/security（新增目录）、src/router（component-registry 或既有动态组件映射）、v-permission 指令使用点。
- Components：AdminUserListView、RoleListView、MenuTreeView、security store、security api。
- APIs：/api/admin/security/admins（GET page/size、POST、PATCH /{id}/status、PUT /{id}/password）、PUT /admins/{id}/roles（裸 number[]）、/roles（GET/POST/PATCH/DELETE）、/menus、/permissions（GET）、PUT /role-authorizations。
- Data Objects：AdminPage、AdminRow、RoleRow、MenuNode、PermissionNode（字段以后端 view 记录实测为准）。

## 4. Design References

- requirement-design.md §2.1（A1 前端结构）、§3（仓库影响 repo-2）、§4（契约影响：零新增后端端点）；
- story-design.md §1 repo-2 段、§2 接口契约细化（载荷冻结）、§4 错误处理；
- story-spec.md §3 业务规则（两步创建、全量覆盖授权）。

## 5. Dependencies

无（DU-BE-702 条件菜单种子与本 DU 并行，前端开发以 mock 数据先行）。

## 6. Implementation Sketch

- 组件/调用关系：views/security/* → stores/security（pinia）→ api/security（既有 http 封装，自动携带 ADMIN JWT、解包 UnifyResult.data）→ 网关 /api/admin/security/**。
- 数据流：AdminUserListView onMounted/翻页 → store.loadAdmins(page,size)；过滤关键字为 store computed，不触发请求；新建成功 ElMessage 刷新当前页并提示可分配角色；分配角色对话框加载 listRoles，已关联角色回显（出参字段实测），保存 PUT 裸数组。
- 授权抽屉：listMenus 构树（parentId/id），listPermissions 按 type 分组；编辑角色时按角色现有授权回显 menuIds/permissionIds（字段实测）；保存收集勾选全集 → replaceRoleAuthorizations({targetId, permissionIds, menuIds})。
- 路由：component-registry 键名与（可能新增的）V11 菜单 componentKey 保持一致；bootstrap 菜单驱动路由表，三页面组件懒加载。
- 领域边界：纯前端展示/编排；任何权限判定不在前端绕过（按钮隐藏仅 UX，403 仍以后端为准并展示 message）。
- 错误路径：401 既有拦截；403/409/404 展示后端 message；对话框/抽屉在失败时保持打开与表单内容；保存按钮 loading 防重复提交。

## 7. Pseudocode

N/A + 理由：未命中 complexity-trigger（无业务算法/状态机/跨服务编排；为标准 CRUD 视图与树勾选表单，控制流已在 §6 充分描述）。
