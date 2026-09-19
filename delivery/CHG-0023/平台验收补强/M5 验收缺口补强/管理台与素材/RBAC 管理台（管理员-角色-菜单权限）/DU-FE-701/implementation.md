# DU Implementation — DU-FE-701

## 变更内容

mall-admin 新增 RBAC 管理台（纯前端，对接 identity 既有 /api/admin/security/** 端点）：

- src/api/security.ts：admins 分页/创建/状态/密码/角色替换、roles CRUD、menus/permissions 查询、role-authorizations 全量替换；类型按后端视图实测建模（AdminRow 含 roleIds；RoleRow 含 permissionIds/menuIds）。
- src/stores/security.ts：admins 分页态与 roles/menus/permissions 加载；当前页用户名/状态本地过滤 computed（不发服务端搜索请求）。
- src/views/security/：AdminUserListView.vue（分页表格、当前页过滤、新建、启停、重置密码、分配角色回显）、RoleListView.vue（角色 CRUD + 菜单树/权限点授权抽屉，回显与全量保存）、MenuTreeView.vue（只读树）；use-admin-users.ts/use-roles.ts/use-menu-tree.ts 行为 composable；security-display.ts 树构建/分组纯函数。
- src/router/component-registry.ts：注册 SecurityAdmins/SecurityRoles/SecurityMenus（与 V11 种子 component_key 一致），动态菜单驱动路由。
- v-permission：admin:create/admin:update/admin-role:assign/role:create/role:update/role:delete/role-permission:assign 按钮级接线。
- 测试 6 个 spec 文件：api 请求契约（含裸数组角色体、授权复合体）、store、两页 composable、树纯函数、权限指令与只读守卫。

门禁结果：vitest 22 文件 91/91（基线 47，净增 44，无 skip）；type-check、lint（security 目录零告警）、build 均通过。

## Commits

见同 Story 根 implementation.md §2（本地提交，未 push）。

## Deviations

### DEV-1
- 原 DU 建议: 角色多选/菜单树勾选"打开时回显当前授权"，task-spec 假设可从视图字段推导。
- 实际实现: 实施时发现后端出参无 roleIds/menuIds/permissionIds，先按"空勾选+全量覆盖警告"交付；随后由 DU-BE-702 关联后端改动在既有出参补齐三字段（未新增端点），前端改为真实回显（roleIds 初始勾选；菜单树 default-checked-keys 适配异步数据到达时序，权限点 checkbox-group 直接回显）。
- 原因: 冻结契约在实施核对时发现读模型缺口，盲操作全量覆盖不满足可演示性。
- 影响评估: 后端为读视图追加字段（向后兼容），无端点/权限模型变化；前端回显与提交语义均有测试。
- 备注: 本偏离的后端部分见 DU-BE-702 DEV-1。

## 自检

- 任务 1~7 全部完成；AC-001~005 由 TC-001~12 覆盖（test-design.md）。
- 未改后端代码、未引入新依赖、未改既有断言；无权限控制仅 UX 隐藏，403 仍由后端裁决。
