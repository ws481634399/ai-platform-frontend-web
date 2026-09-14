# DU Implementation — DU-FE-402

> DU 级实施记录（Actual Implementation，sdd-dev 绑定本 DU 产出）。实施正文归属本仓库。
> 本文件固定为 Actual Implementation（实际修改模块/文件、Commit、Task/DU Mapping、实现偏离、完成情况），
> 与 task-design.md / task-spec.md（Expected Implementation）分立，不得合并。

## 变更内容

- `ProductEditView.vue`：桌面端商品编辑页补齐图片、唯一主图、属性与 SKU 的新增/删除/回显；新建商品必须先维护 SKU，保存时一次提交聚合 payload。
- `product.ts`：区分创建与更新契约，创建类型强制要求 `code` 与 `skus`。
- `http.ts`：认证端点 401 不再递归调用 refresh，并新增错误密码登录回归测试。
- `router/index.ts` 与 `PageHeader.vue`：消除空路径子路由警告及 lint error。
- 在实际运行的 mall-admin 中完成管理员登录与商品新建页桌面浏览器检查。

## Commits

- 开发基线：`71d7bef`。
- 结果 Commit：`b34ae62`（`feat(admin): complete product aggregate editor`）。

## Deviations

<!-- 实现与 DU 建议（Sketch / Pseudocode）明显偏离时必须记录；无偏离写「无」。
     每条偏离三要素缺一不可：原 DU 建议 / 实际实现 / 原因（建议附影响评估）。
     格式：### DEV-N
           - 原 DU 建议:
           - 实际实现:
           - 原因:
           - 影响评估: -->

无。

## 自检

- [x] TC-003/TC-004：页面支持图片、主图、属性和创建前 SKU；主图切换会将旧主图降为普通图。
- [x] TC-008：错误登录 401 不请求 refresh；其他 API 的刷新逻辑保持不变。
- [x] TC-009：Vitest 29/29、type-check、lint（0 error）与 production build 全通过。
- [x] 浏览器：真实登录成功并打开 `/products/edit`，页面关键区块均渲染。
- [x] `git diff --check`：通过。
