# DU Implementation — DU-FE-504

> DU 级实施记录（Actual Implementation，sdd-dev 绑定本 DU 产出）。实施正文归属本仓库。
> 本文件固定为 Actual Implementation（实际修改模块/文件、Commit、Task/DU Mapping、实现偏离、完成情况），
> 与 task-design.md / task-spec.md（Expected Implementation）分立，不得合并。

## 变更内容

mall-web C 端消费公开开关，按开关控制搜索与游客加购入口，fail-open：

- **API 层**：[features.ts](file:///d:/Desktop/ai-platform/implementation/ai-platform-frontend/mall-web/src/api/features.ts) 新增 featuresApi.getPublicFeatures()：GET `/api/mall/public-features`，解包时明确 `UnifyResult.data` 直接为 `PublicFeature[]` 数组（无 items 包裹），返回 [{key,enabled}]。
- **Pinia store**：[features.ts](file:///d:/Desktop/ai-platform/implementation/ai-platform-frontend/mall-web/src/stores/features.ts)：features 以 Map 形态持有、loaded 标志；load() 成功后映射 key→enabled，失败静默（catch 内不抛不提示），finally loaded=true；hasFeature(key, fallback=true)——未加载完成或缺键均回落 fallback（fail-open）。
- **启动加载**：[main.ts](file:///d:/Desktop/ai-platform/implementation/ai-platform-frontend/mall-web/src/main.ts) mount 后 `void useFeaturesStore(pinia).load()` fire-and-forget，不阻塞首屏。
- **搜索受控**：[MallLayout.vue](file:///d:/Desktop/ai-platform/implementation/ai-platform-frontend/mall-web/src/layouts/MallLayout.vue) 顶部搜索入口 router-link（to=/search，data-testid="mall-search-link"）`v-if="features.hasFeature('search.enabled', true)"`；[SearchView.vue](file:///d:/Desktop/ai-platform/implementation/ai-platform-frontend/mall-web/src/views/search/SearchView.vue) searchEnabled computed，关闭态渲染「搜索功能暂未开放」空态（data-testid="search-closed"，引导去商品列表）且不发任何搜索请求。
- **游客加购受控**：[ProductDetailView.vue](file:///d:/Desktop/ai-platform/implementation/ai-platform-frontend/mall-web/src/views/product/ProductDetailView.vue)：guestCartBlocked = `!member.isAuthenticated && !features.hasFeature('mall.guest-cart.enabled', true)`；加购按钮（data-testid="add-cart-btn"）:disabled 纳入该条件；关闭态展示 guest-cart-blocked-hint 段落「游客购物车暂未开放，请登录后加购」+ 登录 router-link；addToCart() 方法内二次兜底守卫；会员不受影响。
- **测试**：[features.spec.ts](file:///d:/Desktop/ai-platform/implementation/ai-platform-frontend/mall-web/src/stores/features.spec.ts) 3 例（未加载时回落 fallback、load 成功映射且缺键回落 fallback、load 失败静默 fail-open）；[ProductDetailView.spec.ts](file:///d:/Desktop/ai-platform/implementation/ai-platform-frontend/mall-web/src/views/product/ProductDetailView.spec.ts) 共 6 例，其中本 DU 新增 2 例（游客且游客车关闭：加购按钮禁用、展示登录引导、不触发加购；开关缺省 fail-open：游客仍可见加购入口且无拦截提示），其余 4 例（页面渲染、富文本净化、404、未选 SKU 禁用）为既有用例。

## Commits

| Commit | 仓库 | 说明 |
| --- | --- | --- |
| af19b9e | repo-2 | DU-FE-504：mall-web 公开开关 API + pinia features store + 启动 fire-and-forget 加载、搜索入口/搜索页空态、游客加购按钮与登录引导守卫、features.spec 3 例与 ProductDetailView.spec 新增 2 例 |

## Deviations

<!-- 实现与 DU 建议（Sketch / Pseudocode）明显偏离时必须记录；无偏离写「无」。
     每条偏离三要素缺一不可：原 DU 建议 / 实际实现 / 原因（建议附影响评估）。
     格式：### DEV-N
           - 原 DU 建议:
           - 实际实现:
           - 原因:
           - 影响评估: -->

### DEV-1
- 原 DU 建议: task-design 建议在全局 axios 拦截器中统一识别 B0606（功能暂未开放）并 toast 提示。
- 实际实现: mall-web http 拦截器未做 B0606 专项处理；关闭态依赖「入口隐藏（MallLayout）+ 页面空态（SearchView）+ 按钮禁用与方法内兜底守卫（ProductDetailView）」在请求发出前拦截。
- 原因: 按 fail-open 与「先于请求受控」的设计，正常路径下关闭开关时前端根本不会发出被切点保护的请求；后端 B0606 仅在 60s 本地缓存窗口（管理端刚翻转、前端尚未重新加载）等竞态下出现，此时按钮已不可点。
- 影响评估: 竞态窗口内若仍有在途请求收到 B0606，走拦截器通用错误展示而非专门文案；影响面仅限极短窗口的存量页面会话，可接受。后续如需专门提示，可在拦截器按 code 增补，不影响现有组件契约。

### DEV-2
- 原 DU 建议: test-design 规划搜索布局组件（MallLayout 入口显隐）组件级 vitest。
- 实际实现: 自动化测试落在 store（features.spec 3 例）与 ProductDetailView（新增 2 例）；MallLayout v-if 与 SearchView 空态无专门组件测试。
- 原因: hasFeature 的两态/缺省/失败语义已在 store 层完整覆盖，布局与搜索页仅为该纯函数的模板接线；组件挂载测试基建在 mall-web 仅覆盖商品详情等少数页面。
- 影响评估: 入口显隐接线缺少直接断言，依赖 Integration Gate 场景六浏览器验收；store 纯逻辑错误不会被测试漏放。

## 自检

对照 task-spec.md「Verification」逐条：

- **Unit（vitest：msw 两态/加载失败 fail-open/入口显隐/拦截器 B0606 提示）**：⚠️ 大部分覆盖——store 3 例覆盖未加载 fallback、成功映射 + 缺键 fallback、加载失败静默 fail-open；ProductDetailView 新增 2 例覆盖游客关闭态与缺省 fail-open；MallLayout/SearchView 接线无专门用例（DEV-2），B0606 拦截器未实现故无对应用例（DEV-1）。
- **Integration（浏览器开关动态生效放 Integration Gate 场景六）**：✅ 按设计将「管理端翻转 → ≤60s C 端刷新/重进后入口显隐变化、搜索空态、游客加购引导」列入联调验收；本 DU 仅回填代码证据。
- **API（对接 /api/mall/public-features 契约）**：✅ 按数组契约解包（features.ts 注释明确 data 直接为数组），字段取 key/enabled，与 DU-BE-509 PublicFeaturesController 输出一致。
- **Migration**：N/A ✅ 前端无数据库迁移。
- **Error Case（public-features 503/超时不白屏、默认可见）**：✅ load() catch 静默 + finally loaded=true，hasFeature 缺省 true——features.spec 第 3 例直接覆盖失败 fail-open；main.ts fire-and-forget 不阻塞挂载，接口不可用时首屏正常渲染且入口默认可见。
- **测试计数（源码清点）**：features.spec.ts 3 个 it；ProductDetailView.spec.ts 共 6 个 it（本 DU 新增 2 个）。当前工作区前端 node_modules 未安装，无法本地执行 vitest，计数为源码逐用例清点结果，非实跑结果。
