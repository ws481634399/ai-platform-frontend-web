# DU Implementation — DU-FE-301

## Status

completed

## Actual Implementation

mall-admin 分类可视化维护页，对接 DU-BE-302 五个管理端端点。

主要文件：
- `mall-admin/src/api/product/category.ts`（新增）：CategoryNode/CategoryPayload/CategoryStatus 类型；categoryApi.tree/get/create/update/changeStatus，沿用 auth.ts 的 UnifyResult 解包约定。
- `mall-admin/src/views/product/CategoryTreeView.vue`（新增）：
  - el-table 树表（row-key=id、default-expand-all、tree-props.children），onMounted 拉取 tree
  - 工具条「新增根分类」与行内「新增子级（level<3 且父节点启用）/ 编辑 / 启用·禁用」按 `product:category:*` 权限码显隐
  - el-dialog 表单：名称必填 1~32（maxlength + show-word-limit）、el-input-number 排序；创建预填 parentId，编辑提交原 parentId
  - 启停走 ElMessageBox.confirm 二次确认；服务端业务错误（同名/层级/禁用父等）从 UnifyResult.message 提取经 ElMessage 中文反馈
  - 禁用节点 el-tag 灰色 + 行 class 置灰，不禁用其子孙显示（对齐后端不级联语义）
- `mall-admin/src/router/component-registry.ts`（修改）：注册 `CategoryTree`（与 identity V3 菜单 component_key 一致），动态路由即可挂载。
- `mall-admin/src/components.d.ts`（构建自动再生成）：新页面用到的 Element Plus 组件声明。
- `mall-admin/src/api/product/category.spec.ts`（新增）：api 层端点路径、payload、解包 3 个用例。

## Conformance

- 唯一 HTTP 出口为 `src/api/http.ts` 实例（Bearer/401 刷新/TraceId 拦截器复用），无直接 axios 调用。
- 按钮权限统一经 usePermission().has(code)，无硬编码角色。
- component_key `CategoryTree` 与 mall-identity V3 种子完全一致，动态菜单零额外配置。

## Verification

- pnpm test：25 passed（含新增 3 例）
- pnpm type-check：0 error
- pnpm lint：0 error（66 warning 为全仓既有的模板格式风格提示）
- pnpm build：成功
- 日志见 evidence/logs/{test,type-check,lint,build}.log

## Deviations

- 搭车修复既有 `src/api/http.spec.ts` 的 vue-tsc 报错（axios 类型收紧后 adapter mock 的 config 应为 InternalAxiosRequestConfig），仅测试类型标注调整，运行时行为不变；修复后该规格全部用例仍通过。
- el-table 操作列 slot 的 row 推断为 DefaultRow，按 Element Plus + vue-tsc 当前版本行为在三处事件处理上显式断言为 CategoryNode（运行时数据形状本就一致）。
