# DU Implementation — DU-FE-704

> DU 级实施记录（Actual Implementation，sdd-dev 绑定本 DU 产出）。实施正文归属本仓库。
> 本文件固定为 Actual Implementation（实际修改模块/文件、Commit、Task/DU Mapping、实现偏离、完成情况），
> 与 task-design.md / task-spec.md（Expected Implementation）分立，不得合并。

## 变更内容

mall-admin 品牌与商品图片上传组件及两表单接线（commit c268b3b）：

1. src/api/product/image.ts（新增）+ image.spec.ts（2 例）：
   - `uploadProductImage(scene: 'BRAND'|'PRODUCT', file)`：FormData append file+scene，POST /api/admin/product-images，不手设 Content-Type（浏览器自动补 multipart boundary），unwrap 返回 data；ProductImageScene/ProductImageUploadResult 类型导出。
2. src/views/product/components/image-validate.ts（新增）+ image-validate.spec.ts（5 例）：
   - `validateImageFile(file, maxSizeMb=2)`：null/size=0 → empty；扩展名白名单 jpg/jpeg/png/webp（小写比较）外 → type；超 2MB → size；通过 → {ok:true}。注释明示终验以后端魔数为准。
3. src/views/product/components/ImageUploader.vue（新增）+ ImageUploader.contract.spec.ts（4 例）：
   - props modelValue/scene/maxSizeMb；v-model 回填 + uploaded 事件；el-upload accept 三格式、:auto-upload=false 改自定义 http-request 走 imageApi（无 action= 直传属性）；上传中 loading、失败按后端信封 message 提示、成功显示预览缩略图；外链模式（modelValue 为 http URL）同样可预览。
4. src/views/product/image-integration.contract.spec.ts（新增，3 例）：Vite `?raw` 读 BrandListView.vue / ProductAssetsEditor.vue 源码断言——Logo 行与 imageUrl 单元格中外链 el-input 保留、ImageUploader 存在且 scene 分别 BRAND/PRODUCT、v-model 绑定 form.logo / row.imageUrl 同一字段。
5. BrandListView.vue（改）：品牌表单 Logo 的 el-input 下方接入 ImageUploader（scene=BRAND，v-model=form.logo），外链输入保留可手改。
6. ProductAssetsEditor.vue（改）：图片 URL 单元格包 .image-url-cell 容器，el-input 与 ImageUploader（scene=PRODUCT，v-model=image.imageUrl）并存。
7. components.d.ts：unplugin 自动追加 ElUpload 组件声明。

门禁：mall-admin vitest 26 文件 105/105 全绿（基线 91 + 净增 14）；vue-tsc type-check、eslint、vite build 均通过（无 jsdom/@vue/test-utils 新依赖）。

## Commits

见同 Story 根 implementation.md §2（本地提交 c268b3b，未 push）。

## Deviations

### DEV-1
- 原 DU 建议: SFC 契约测试可参照仓库 readFileSync 读源码惯例。
- 实际实现: 使用 Vite `?raw` import 读取 .vue 源码做契约断言。
- 原因: 仓库实际无 readFileSync 测试先例，`?raw` 是 Vite 原生能力且 ESM 静态导入更契合 vitest；http-request 回调类型采用 element-plus 的 UploadRequestOptions（避免 ESLint browser globals 依赖）。
- 影响评估: 纯测试手法差异，断言力等同；build 通过证明真实模板可编译。已在 Story test-design §2 策略与根 implementation DEV-4 记录。

## 自检

- AC-008：api/校验/组件/接入 14 例覆盖成功回填、loading/失败提示、外链保留、两 scene 接线；type-check/lint/build 全绿。
- AC-009：mall-admin 105/105 不回退。浏览器真实选图、进度条观感与 MinIO 端到端属 C 类 Integration Gate。
