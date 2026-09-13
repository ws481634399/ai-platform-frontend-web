# DU Implementation — DU-FE-302

## Status

completed

## Actual Implementation

mall-admin 品牌可视化维护页（Vue 3.5 + Element Plus + Pinia）。

- `src/api/product/brand.ts`（新增）：BrandItem/BrandQuery/SaveBrandPayload/PageView 类型；brandApi.page（keyword/status/page/size，空条件不下发）/create/update/changeStatus；复用 http 实例 UnifyResult 解包与拦截器报错。
- `src/api/product/brand.spec.ts`（新增，3 例）：分页参数与解包、空筛选条件归一、create/update/changeStatus 端点与载荷。
- `src/views/product/BrandListView.vue`（新增）：
  - 查询区：名称关键字 + 状态下拉 + 查询/重置（回车与 clear 触发，查询回到第一页）
  - 表格：ID / Logo（el-image 48px 缩略、点击预览、加载失败占位、无图 —）/ 名称 / 描述 / 排序 / 状态 Tag / 操作
  - el-pagination：total/sizes/prev/pager/next/jumper，页大小 10/20/50，切页大小回第一页
  - 新增/编辑 el-dialog：名称必填 ≤64（去空白）、Logo 可空非空须 http(s) 形态且 ≤512、描述 ≤255、sort 0~9999
  - 启停 ElMessageBox 二次确认；按钮按 product:brand:{create,update,disable} 权限显隐（usePermission）
  - 409 重名等服务端错误由拦截器提示且保留表单输入，便于改名重试
- `src/router/component-registry.ts`（修改）：注册菜单组件键 `BrandList`（与 V3 迁移 PAGE 菜单 component_key 对齐）。

## Conformance

- 接口契约对齐 DU-BE-303：基路径 /api/admin/brands、PageView{records,total,page,size}、状态枚举 ENABLED/DISABLED。
- 复用既有 http 拦截器（Bearer/Trace-Id/401 刷新/统一错误提示）与动态菜单 componentKey 解析机制，无新增依赖。

## Verification

- pnpm test：28 passed（含品牌 API 3 例，原 25 例无回归）
- vue-tsc type-check：0 error
- eslint：0 error（67 warning 为全仓既有格式风格项；新文件经 --fix 后不新增 error）
- vite build：成功
- 日志：evidence/logs/{test,type-check,lint,build}.log

## Deviations

- Logo 形态校验未用 `new URL()`（仓库 ESLint flat config 未声明浏览器全局，no-undef 报 error），改为 `/^https?:\/\/\S+$/` 前端初筛；后端 Brand 聚合仍保留严格 URI 终验，安全语义不变。
