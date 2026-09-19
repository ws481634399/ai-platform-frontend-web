# DU Task Design — DU-FE-704

> 层级：实现仓（Repository）侧产物——Expected Implementation 之"怎么做"（DU 技术方案）。
> 权威 DU 划分：外部 story-design.md §5（SSOT）；本文件只按 DU id DU-FE-704 引用该表，不新造 DU。
> 互链：通过 DU id DU-FE-704 与同目录 task-spec.md（"做什么/验收"）配对互链。
> 本文件固定为 Expected Implementation（Plan / Sketch / Pseudocode），
> 与 implementation.md（Actual Implementation）分立，不得合并。

## 1. Goal

为 mall-admin 品牌表单与商品素材编辑器提供"本地图片上传→自动回填可公开 URL→预览"能力，同时完整保留外链 URL 手工输入。新增通用 ImageUploader 组件与 product-images api，不改品牌/商品保存接口的提交结构。职责边界以外部 story-design.md §1（repo-2 段）为权威。

## 2. Repository

repo-2（implementation/ai-platform-frontend），仅 mall-admin 应用；不涉及 mall-web。

## 3. Scope

- 新增：
  - src/api/product/image.ts、src/api/product/image.spec.ts
  - src/views/product/components/image-validate.ts、image-validate.spec.ts
  - src/views/product/components/ImageUploader.vue、ImageUploader.contract.spec.ts
  - src/views/product/components/image-integration.contract.spec.ts（两接入点共存契约）
- 修改：src/views/product/BrandListView.vue（Logo 表单项）、src/views/product/ProductAssetsEditor.vue（图片行）
- 不动：路由、菜单、权限指令、pinia、http.ts、品牌/商品既有 api 与提交载荷字段

## 4. Design References

- requirement-design.md §2.2 前端段（ImageUploader/两表单接入/外链保留冻结要求）
- story-design.md §1（repo-2 逐文件设计）、§2（multipart 契约与失败矩阵）、§4（前端错误处理）、§6（前端测试策略）
- 实证样板：src/api/http.ts（统一 axios 实例与拦截器，Authorization 自动注入）、src/api/product/brand.ts（api 模块/unwrap 写法）、src/views/product/BrandListView.vue L202-L211（Logo 项现状）、ProductAssetsEditor.vue L9-L21（图片行现状）、src/views/security/*.spec.ts（无 jsdom 的 SFC 源码契约测试惯例）

## 5. Dependencies

无代码依赖；与 DU-BE-703 跨仓并行，接口契约已冻结（POST /api/admin/product-images；multipart 字段 file + scene；data.url）。

## 6. Implementation Sketch

- api 层（image.ts）：`export type ProductImageScene = 'BRAND' | 'PRODUCT'`；`uploadProductImage(scene, file)` 内 `const fd = new FormData(); fd.append('file', file); fd.append('scene', scene)`；`http.post('/api/admin/product-images', fd)`（不显式设 Content-Type，交 axios 带 boundary）；返回 `response.data.data`（{url}）。
- 纯函数（image-validate.ts）：`validateImageFile(file: File, maxSizeMb = 2)`——file 缺失/ size===0 → {ok:false,reason:'empty'}；扩展名（name 最后一个 '.' 后小写）∉ {jpg,jpeg,png,webp} → reason:'type'；size > maxSizeMb*1024*1024 → reason:'size'；否则 {ok:true}。
- 组件（ImageUploader.vue）：
  - defineProps<{ modelValue: string; scene: ProductImageScene; maxSizeMb?: number }>()；defineEmits<{ 'update:modelValue':[url:string]; uploaded:[url:string] }>()
  - el-upload：`:show-file-list="false"`、`accept="image/jpeg,image/png,image/webp"`、`:http-request="doUpload"`（不用 action，保证走统一 http 实例携带 Authorization）
  - doUpload(options)：先 validateImageFile(options.file)，失败 ElMessage.warning 且 return；uploading=true 调 uploadProductImage，成功双 emit + ElMessage.success，失败由拦截器提示并保证不清空 modelValue，finally uploading=false；按钮 :loading/disabled
  - 预览：modelValue 非空时 el-image（fit contain、:preview-src-list、error 槽 PictureFilled 兜底）
- 接入：
  - BrandListView Logo el-form-item：原 el-input 保留不动，紧接其下加 `<ImageUploader v-model="form.logo" scene="BRAND" />`；form.logo 仍是字符串，提交逻辑零改动（外链校验规则继续生效，MinIO URL 为 http(s) 合法形态）。
  - ProductAssetsEditor 图片行：objectKey el-input 保留；imageUrl 单元格改为纵向 div（el-input + ImageUploader 紧凑按钮），`:model-value="image.imageUrl"` + `@update:model-value="image.imageUrl = $event"`，scene="PRODUCT"；grid 列宽做最小适配。
- 测试手法（无 jsdom/@vue/test-utils，不引依赖）：api/纯函数常规 vitest（vi.mock http；FormData 用全局实现，断言 post 第二参数 fd.get('file')/fd.get('scene')）；组件与接入用 readFileSync 读 .vue 源码做契约断言（props/emits/accept/http-request/外链 el-input 共存/绑定字段名），仿 security-controls.spec.ts。

## 7. Pseudocode

未命中 complexity-trigger（无状态机/算法/编排；为简单表单控件与透传 api 调用）。N/A + 理由：组件控制流线性（校验→请求→emit），§6 已逐文件给出确定实现结构，无需额外伪代码。
