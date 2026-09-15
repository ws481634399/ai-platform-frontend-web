# DU Implementation — DU-FE-501

> DU 级实施记录（Actual Implementation，sdd-dev 绑定本 DU 产出）。实施正文归属本仓库。
> 本文件固定为 Actual Implementation（实际修改模块/文件、Commit、Task/DU Mapping、实现偏离、完成情况），
> 与 task-design.md / task-spec.md（Expected Implementation）分立，不得合并。

## 变更内容

配合 DU-BE-501 雪花 ID 字符串契约，mall-admin 商品/SKU/分类/品牌/库存五个业务面去数值化，
保证 19 位 ID（> Number.MAX_SAFE_INTEGER）端到端不丢精度。**仅业务 ID 变 string**；金额（分）、
数量、分页、层级、排序保持 number；请求直接传字符串，前端不做任何数值转换。

1. **API 类型层**（commit dd034e8）：product/brand/category/inventory 四个 api 模块的 id/skuId/
   categoryId/brandId/productId/parentId/operator 及各方法形参、创建返回值 number→string；
   brand/category 两个 api spec 夹具改 19 位字符串。
2. **视图层**（commit ffeb468）：
   - 路由：商品编辑页 `String(route.query.id)` 直取，禁止 `Number()`；跳转 query 透传字符串；
   - 表单/筛选：el-select/el-input 去 `.number`，ID 默认值 `''`/`undefined`，提交前 trim；
   - 分类：根节点 parentId 由 0 改 `"0"`（比较、弹窗标题同步）；
   - 商品编辑：`EditableSku.id` 改 string，未保存商品的本地 SKU 以 `local-<n>` 临时键标识
     （原负数自增在字符串语义下保留但加前缀，避免与真实雪花混淆）；
   - 库存：初始化 SKU 输入由 el-input-number 改 el-input（maxlength=19，`/^\d{1,19}$/`）；
   - 表格 ID/skuId 列宽放宽至 190/200 完整展示 19 位；
   - product-editor spec 夹具改字符串并增「雪花 ID 不丢精度」断言。
3. **真后端五页面冒烟 + 接口固化**：见 evidence/red-green.md 与 evidence/logs/smoke-api-verify.log。

详细文件清单见 evidence/changeset.md，红/绿与冒烟证据见 evidence/red-green.md。

## Commits

| Commit | 任务 | 说明 |
|---|---|---|
| dd034e8 | 任务1（API） | refactor(admin-api): 四个 api 模块业务 ID string 化 + api spec |
| ffeb468 | 任务1（视图） | refactor(admin-views): 五业务面视图去数值化 + editor spec |
| docs 提交 | 任务2/3 | docs(sdd): DU-FE-501 implementation/evidence（含静态门禁与冒烟日志，不自引用 hash） |

完整短 hash/消息对照见 evidence/commits.md。

## Deviations

### DEV-1 未保存商品的本地 SKU 标识：负数 number → `local-<n>` 字符串键
- 原 DU 建议: task-design.md §6「行 key、详情路由跳转参数、表单回显/提交、比较逻辑去数值化」，
  未规定 EditableSku 在商品创建前的本地临时 ID 形态。
- 实际实现: 本地 SKU 的 `id` 由负整数自增改为 `` `local-${localSkuId--}` `` 字符串；提交商品时
  该字段不进 create payload（`buildCreateProductPayload` 只取 skuCode/specifications/price/image）。
- 原因: `EditableSku.id` 必须与已存 SKU 的字符串雪花 ID 统一类型，否则编辑态表格与方法签名无法复用；
  加 `local-` 前缀可直观区分「未持久化临时键」与「真实 ID」，杜绝任何被误传回后端的可能。
- 影响评估: 纯前端内存态标识，不参与任何请求；vitest product-editor 两个用例通过。

### DEV-2 验证方式：五页面浏览器冒烟之外补充接口级固化证据
- 原 DU 建议: task-spec 任务2/3 要求五页面手工冒烟 + skuId 原样回传比对。
- 实际实现: 浏览器完成全部真实操作（创建/跳转/回显/库存操作），另以 PowerShell 调用经网关的
  admin/internal HTTP 接口固化关键断言（JSON 中 ID 带引号、数量为 number、舍入 ID 404、
  internal 双 404），日志留存 evidence/logs/smoke-api-verify.log。
- 原因: 浏览器截图不可机读、易受会话时效影响；接口断言可精确比对 19 位字符串逐字符一致性，
  作为 AC-012「无末位偏差」的可审计证据。
- 影响评估: 证据增强，不改变任务范围；冒烟同时暴露并联动修复了 DU-BE-501 DEV-4（流水 id 漏传）。

## 自检

- [x] `pnpm type-check`：vue-tsc 双 tsconfig **0 错误**（run1 30 处类型红 → run3 清零，日志齐）。
- [x] `pnpm lint`：**0 errors**（281 warnings 为存量格式告警，非本次引入）。
- [x] `pnpm test`：vitest **14 文件 / 31 用例全绿**，含三个字符串 ID 夹具/断言用例。
- [x] `pnpm build`：vite build 成功（1800 模块，4.19s）。
- [x] AC-011：品牌/分类三级/商品+SKU/库存列表/日志五页面 CRUD、分页、跳转、编辑回显不回归。
- [x] AC-012：商品 `2099557758270611458`、SKU `2099557758287388674` 从创建→列表→编辑 URL→
      详情 JSON→库存初始化/调整/日志筛选全程 19 位字符串无末位偏差；舍入形态反证 404。
- [x] 边界克制：金额/数量/分页/层级/排序保持 number；自动生成的 components.d.ts/auto-imports.d.ts 不提交。
- [x] 依赖 DU-BE-501：冒烟基于其构建产物；联动发现的流水 id 缺陷已由 DU-BE-501 DEV-4 修复并回归。
