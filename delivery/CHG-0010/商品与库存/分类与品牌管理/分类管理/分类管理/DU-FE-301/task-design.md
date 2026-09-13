# DU Task Design — DU-FE-301

> 层级：实现仓（Repository）侧产物——Expected Implementation 之"怎么做"（DU 技术方案）。
> 权威 DU 划分：外部 requirement-design.md §6（SSOT）；本文件只按 DU id DU-FE-301 引用该表，不新造 DU。
> 互链：通过 DU id DU-FE-301 与同目录 task-spec.md（"做什么/验收"）配对互链。
> 本文件固定为 Expected Implementation（Plan / Sketch / Pseudocode），
> 与 implementation.md（Actual Implementation）分立，不得合并。

## 1. Goal

mall-admin 分类可视化维护端到端可用：树形展示（含禁用置灰）、新增子级、编辑改名/排序、启停（requirement-design.md §6 / DU-FE-301 goal 原文）。

## 2. Repository

repo-2（ai-platform-frontend / mall-admin，Vue 3.5 + Vite + Element Plus + Pinia + axios）。

## 3. Scope

- `src/api/product/category.ts`（新增）：类型 CategoryNode/CreatePayload/UpdatePayload/StatusPayload；方法 fetchCategoryTree/createCategory/updateCategory/changeCategoryStatus。
- `src/views/product/CategoryTreeView.vue`（新增）：树表渲染、节点操作按钮、新增/编辑 el-dialog 表单、启停 ElMessageBox 二次确认、ElMessage 反馈、禁用节点置灰。
- `src/router/component-registry.ts`（修改）：登记 `CategoryTree`（懒加载 import）。
- 不新增依赖；按钮权限接既有 `stores/permission.ts` 的 `has(code)`。

## 4. Design References

- requirement-design.md §4（基路径 /api/admin/categories、权限码 product:category:*）、§6 / DU-FE-301。
- story-design.md §1.2（前端模块清单）、§2（接口契约）。
- 既有实现：`src/api/http.ts`（baseURL/拦截器/Bearer）、`src/stores/permission.ts`、`src/router/dynamic-routes.ts`、component-registry 既有注册形态。

## 5. Dependencies

DU-BE-302（分类后端五端点与公共前置必须可用）。

## 6. Implementation Sketch

```text
CategoryTreeView.vue
  ├─ onMounted: categoryApi.tree() → rows（el-table row-key=id, tree-props children）
  ├─ 工具条：v-if="has('product:category:create')" 新增根分类
  ├─ 行操作：新增子级(预填 parentId) / 编辑 / 启用|禁用
  │     ├─ 新增/编辑 → CategoryFormDialog（el-form 校验 name 1..32、sort 数字）
  │     │     submit → create/update API → ElMessage 成功 → reloadTree()
  │     └─ 启停 → ElMessageBox.confirm → changeStatus API → reloadTree()
  └─ 禁用行 :class 置灰、status tag（Element Plus el-tag ENABLED 绿/DISABLED 灰）
src/api/product/category.ts → http 实例（自动 baseURL + Bearer + 401/403 拦截）
```

数据流与错误处理：API 返回 UnifyResult 由 http 拦截器统一解包/报错；组件只处理成功刷新与局部 loading；表单校验在前端做必填/长度，服务端业务错误（同名/超层级等）直接展示拦截器提取的中文 message。

## 7. Pseudocode

N/A —— 本 DU 为表单/树表交互型页面，无复杂分支或状态机；调用关系与交互顺序已在 §6 Sketch 完整表达。metadata complexity-trigger 未命中。
