# Red-Green Evidence — DU-FE-501

> mall-admin 商品/SKU/分类/品牌/库存五个业务面字符串 ID 改造。验证链：
> 类型清零 → lint → 单测 → 生产构建 → 真实后端五页面冒烟 + 接口反证。

## Red（改造前/中途失败基线）

| 证据日志 | 失败事实 |
|---|---|
| logs/fe-typecheck-red-before.log | 改造前 vue-tsc 基线：**0 错误**（数值类型自洽，红在运行时精度风险，需先改 API 层制造类型红） |
| logs/fe-typecheck-run1.log | API 层改 string 后视图层未跟进：**30 处 TS2345/TS2322**，分布 inventory 两视图、brand/category/product 视图与 3 个 spec（number 不可赋 string） |
| logs/fe-typecheck-run2.log | 视图层改完后收敛为 product-editor.spec.ts **3 处**（表单夹具仍 number[]） |

## Green（静态门禁全绿）

| 证据日志 | 命令 | 结果 |
|---|---|---|
| logs/fe-typecheck-run3.log | `pnpm type-check`（vue-tsc 两个 tsconfig） | **0 错误** |
| logs/fe-lint-run1.log | `pnpm lint`（eslint .） | **0 errors**，281 warnings 全为存量 vue/max-attributes-per-line 等格式告警，与本次改造无关 |
| logs/fe-test-run1.log | `pnpm test`（vitest run） | **14 文件 / 31 用例全绿**，含 brand/category/product-editor 三个字符串 ID 夹具用例 |
| logs/fe-build-run1.log | `pnpm build`（vite build） | **✓ built in 4.19s**，1800 modules transformed，产物正常分包 |

## E2E 冒烟（真实后端，2026-09-15）

环境：Docker MySQL/Redis/Nacos/MinIO + identity/product/inventory/gateway 四服务（DU-BE-501 构建产物）
+ `pnpm dev`（:5175，/api 代理网关 :8080）；admin/Admin@123456。服务启动日志见 logs/smoke/。

浏览器真实操作（商品/SKU/分类/品牌/库存五页面）+ 接口级固化（logs/smoke-api-verify.log）：

| 场景 | 结果 |
|---|---|
| 登录 → session bootstrap | 200，菜单/权限正常 |
| 品牌新增「冒烟品牌」、分类三级（根/子/叶子） | 创建成功（品牌/分类为自增 ID：品牌 9、叶子分类 19，按设计非雪花） |
| 商品 SMOKE-001 + SKU-SMOKE-001（12900 分）原子创建 | 成功，**商品 ID `2099557758270611458`（19 位雪花）全链路完整** |
| 列表→编辑跳转 | URL `http://localhost:5175/products/edit?id=2099557758270611458`，query.id 完整、末位非 0，表单回显与 SKU 表格正常 |
| 商品详情 JSON | `"id":"2099557758270611458"`、`skus[0].id":"2099557758287388674"`、`categoryId":"19"`、`brandId":"9"` 均带引号字符串；`salePriceInCents:12900` 仍为 number |
| 库存 init 100 → adjust +50 | 列表数量 100→150，skuId `2099557758287388674` 19 位完整 |
| 库存日志按 skuId 筛选 | INIT/ADJUST 两条，skuId 完整（联调中暴露流水 id="0" 缺陷，已由 DU-BE-501 DEV-4 修复，修复后回填真实雪花 `2099558209569333251`/`2099558287935709185`） |
| 精度丢失反证 | 舍入形态 `...611000` 查商品详情 → **404**，证明字符串链路无隐式数值化 |
| 内部端点外拒 | 经网关访问 `/api/internal/products/skus/{id}`：匿名 **404**、持管理员 JWT **404**（JWT 不通内部） |

已知非阻塞项：冒烟期间一次 `/api/admin/categories/tree` 出现 `net::ERR_ABORTED`（页面快速切换取消请求），重试加载正常；vue-router `Parent route "admin-layout"` 为既有测试期告警。
