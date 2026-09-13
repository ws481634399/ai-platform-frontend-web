# DU Task Design — DU-FE-302

> 层级：实现仓（Repository）侧产物——Expected Implementation 之"怎么做"（DU 技术方案）。
> 权威 DU 划分：外部 requirement-design.md §6（SSOT）；本文件只按 DU id DU-FE-302 引用该表，不新造 DU。
> 互链：通过 DU id DU-FE-302 与同目录 task-spec.md（"做什么/验收"）配对互链。
> 本文件固定为 Expected Implementation（Plan / Sketch / Pseudocode），
> 与 implementation.md（Actual Implementation）分立，不得合并。

## 1. Goal

mall-admin 品牌可视化维护端到端可用：分页表格、名称关键字与状态筛选、新增/编辑（Logo URL）、启停（requirement-design.md §6 / DU-FE-302 goal 原文）。

## 2. Repository

repo-2（ai-platform-frontend / mall-admin，Vue 3.5 + Vite + Element Plus + Pinia + axios）。

## 3. Scope

- `src/api/product/brand.ts`（新增）：类型 BrandItem/BrandQuery/SaveBrandPayload/StatusPayload；方法 fetchBrandPage/getBrand/createBrand/updateBrand/changeBrandStatus。
- `src/views/product/BrandListView.vue`（新增）：查询表单（keyword、status、查询/重置）、el-table（ID/Logo 缩略/名称/描述/排序/状态/操作）、el-pagination、新增/编辑 el-dialog（名称 1..64、Logo URL、描述 ≤255、sort）、启停二次确认。
- `src/router/component-registry.ts`（修改）：登记 `BrandList`。
- 不新增依赖；按钮权限接既有 `stores/permission.ts` 的 `has(code)`。

## 4. Design References

- requirement-design.md §4（基路径 /api/admin/brands、权限码 product:brand:*）、§6 / DU-FE-302。
- story-design.md §1.2、§2（接口契约：分页响应 PageView 字段、Logo URL 形态、分页默认值）。
- 既有实现：`src/api/http.ts`、`src/stores/permission.ts`、component-registry 注册形态；DU-FE-301 建立的 src/api/product/ 目录与页面反馈模式可直接复用。

## 5. Dependencies

DU-BE-303（品牌后端五端点必须可用）；Change 级更早依赖 DU-BE-302 公共前置。

## 6. Implementation Sketch

```text
BrandListView.vue
  ├─ 查询区：el-input(keyword) + el-select(status) + 查询/重置
  ├─ onMounted/watch(query,page,size): brandApi.page(query) → PageView
  ├─ el-table 列：id / logo(el-image 缩略，加载失败占位) / name / description / sort / status(tag)
  ├─ el-pagination：total/page-size 双向，翻页重新拉取
  ├─ 工具条：v-if has('product:brand:create') 新增品牌
  ├─ 行操作：编辑(has update) / 启用|禁用(has disable)
  │     ├─ BrandFormDialog：el-form 校验 name 1..64、logo URL 形态与 ≤512、description ≤255、sort 数字
  │     │     submit → create/update API → ElMessage → 回到当前页刷新
  │     └─ 启停 → ElMessageBox.confirm → changeStatus API → 刷新
  └─ 加载中 v-loading、空数据 Element Plus 默认文案
src/api/product/brand.ts → http 实例（UnifyResult 拦截器统一解包/报错）
```

错误处理：服务端同名冲突/字段非法的中文 message 由拦截器提取并 ElMessage 展示；前端保留表单输入不清空，便于改名重试。

## 7. Pseudocode

N/A —— 本 DU 为分页表格/表单交互型页面，无复杂算法与状态机；分页与筛选交互顺序已在 §6 Sketch 完整表达。metadata complexity-trigger 未命中。
