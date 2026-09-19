# DU Task Spec — DU-FE-704

> 层级：实现仓（Repository）侧产物——Expected Implementation 之"做什么/验收"（DU 契约与验收）。
> 权威 DU 划分：外部 story-design.md §5（SSOT）；本文件只按 DU id DU-FE-704 引用该表，不新造 DU。
> 互链：通过 DU id DU-FE-704 与同目录 task-design.md（"怎么做"）配对互链。
> verifies 约定：任务项绑定 TC-NNN（红绿灯对象）；TC 定义在外部对应 Story 的 test-design.md，本文件只引用不新造。

## 0. 元信息

- DU id: DU-FE-704
- Change ID: CHG-0023
- Feature Path: 平台验收补强/M5 验收缺口补强/管理台与素材/品牌与商品图片文件上传
- 权威来源: story-design.md §5 / DU-FE-704

## 任务清单

- [ ] 任务 1 — 新增 src/api/product/image.ts（uploadProductImage(scene,file) FormData 契约 + ProductImageScene 类型）与 image.spec.ts（verifies: TC-008）
- [ ] 任务 2 — 新增 src/views/product/components/image-validate.ts 纯函数（empty/type/size 三分支，2MB 与 jpeg/png/webp）+ image-validate.spec.ts（verifies: TC-009）
- [ ] 任务 3 — 新增 ImageUploader.vue（props modelValue/scene/maxSizeMb；el-upload 自定义 http-request；accept 三格式；loading/失败提示；el-image 预览；emits update:modelValue/uploaded）+ SFC 契约 spec（verifies: TC-010）
- [ ] 任务 4 — 接入 BrandListView Logo 表单项（保留外链 el-input，上传控件绑定 form.logo，scene=BRAND）；接入 ProductAssetsEditor 图片行（objectKey/imageUrl 双输入保留，上传控件绑定 image.imageUrl，scene=PRODUCT）+ 接入契约 spec（verifies: TC-011）
- [ ] 任务 5 — 全量门禁 vitest/type-check/lint/build（verifies: TC-012）

## Acceptance Criteria

- [ ] AC-008 — 品牌表单与商品素材编辑器出现上传控件，成功自动回填 URL 并预览，loading/失败态可见；外链 URL 文本输入原样保留可手改；api/纯函数/契约测试覆盖
- [ ] AC-009 — 前端新增用例随全量 vitest 全绿；type-check/lint/build 全绿，用例数 ≥ 基线 91+净增；不引入 jsdom/@vue/test-utils 等新依赖

## 执行顺序（Execution Order）

1. 任务 1 → 任务 2（无依赖的纯逻辑先行）
2. 任务 3（组件消费 1/2）
3. 任务 4（两接入点）
4. 任务 5（收口）

## 并行度（Parallelization）

任务 1、2 可并行；其余串行。与 DU-BE-703 跨仓并行（冻结契约：POST /api/admin/product-images，multipart：file+scene，UnifyResult data.url）。

## Verification

- Unit: `pnpm -C mall-admin test`（api FormData/字段断言、validateImageFile 分支）
- Integration: N/A（仓库无浏览器环境；SFC 契约断言 + build 编译证明接线）
- API: TC-008 对 http.post URL/方法/FormData 内容出证；真实端到端属 C 类 Integration Gate
- Migration: N/A
- Error Case: 本地校验 empty/type/size 三失败不发请求且有 reason；上传请求失败由 http 拦截器统一提示且不清空既有 URL（契约断言组件不重置 modelValue 的路径）
