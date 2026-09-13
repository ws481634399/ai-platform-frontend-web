# DU Task Spec — DU-FE-303

> 权威 DU 划分：story-design.md §5 / DU-FE-303
> verifies 绑定 TC-NNN

## 0. 元信息

- DU id: DU-FE-303
- Change ID: CHG-0011
- Feature Path: 商品与库存/商品与 SKU 管理/商品主数据/商品 SPU 管理
- 权威来源: story-design.md §5 / DU-FE-303

## 任务清单

- [ ] 任务 1 — product.ts API 封装（list/get/create/update/skus）（verifies: TC-011）
- [ ] 任务 2 — ProductListView 分页列表+筛选（verifies: TC-011）
- [ ] 任务 3 — ProductEditView 基本信息+图片+属性区块（verifies: TC-011）
- [ ] 任务 4 — ProductEditView SKU 表单区块（规格/价格/启停）（verifies: TC-011）
- [ ] 任务 5 — component-registry 注册 ProductList + 权限按钮（verifies: TC-011）

## Acceptance Criteria

- [ ] AC-011 — mall-admin 商品页可完成列表/创建/编辑/查看，含分类品牌选择、图片、SKU 规格价格编辑
- [ ] AC-013 — 无权限按钮隐藏；直调接口由后端 403（前端不绕过）

## 执行顺序

1. 任务 1 → 2 → 3 → 4 → 5

## 并行度

无

## Verification

- Unit: vitest 组件测试（ProductListView/ProductEditView 渲染与交互）
- Integration: N/A
- API: 联调后端接口，字段一致
- Migration: N/A
- Error Case: 表单校验（必填、价格非负、编码格式）
