# DU Task — DU-FE-301

> Workspace 权威来源：delivery/changes/CHG-0009/身份与权限/后台动态菜单与权限前端/权限状态引导/加载当前管理员身份/tasks.md

### DU-FE-301: 加载当前管理员身份

- Repository: repo-2
- Goal: DES-002：实现本 Story 在 repo-2 的职责
- Scope: [S1] 仅实现 STORY-001-03-01-01 的 AC-001, AC-002, AC-003，不扩展相邻 Story。
- Design References: story-design.md §1–§6；change-design.md §2、§4、§5
- Dependencies: DU-BE-301
- Acceptance Criteria: AC-001, AC-002, AC-003
- Execution Order: 2
- Parallelization: 依赖完成后执行
- verifies: TC-002, TC-003
- Implementation Sketch: 依次固化领域/状态模型、持久化或前端状态边界、应用编排和入口适配；未知状态与越权默认拒绝，敏感信息不进入响应和日志。
- Pseudocode: VALIDATE input and subject; LOAD current state/version; REJECT invalid status, permission or replay; EXECUTE 加载当前管理员身份; PERSIST atomically; RETURN sanitized result.
- Verification: 逐项执行下表 TC 红灯→最小实现→绿灯；随后运行模块测试、静态检查和契约回归。

#### 可执行任务

| Task | 文件/模块 | 具体改动 | verifies | depends on |
|---|---|---|---|---|
| TASK-001 | mall-admin/src/types/auth.ts | 定义 AdminProfile/BootstrapResponse | TC-002, TC-003 | — |
| TASK-002 | mall-admin/src/stores/auth.ts | 加载并暴露当前管理员身份 | TC-002, TC-003 | TASK-001 |
| TASK-003 | mall-admin/src/stores/auth.spec.ts | 覆盖加载、重复初始化和清理 | TC-002, TC-003 | TASK-002 |
