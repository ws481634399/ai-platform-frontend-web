# DU Task Spec — DU-FE-501

> 层级：实现仓（Repository）侧产物——Expected Implementation 之"做什么/验收"（DU 契约与验收）。
> 权威 DU 划分：外部 story-design.md §5（SSOT）。

## 0. 元信息

- DU id: DU-FE-501
- Change ID: CHG-0020
- Feature Path: 商品搜索/商品搜索查询/关键词搜索与筛选/mall-web 商品搜索体验
- 权威来源: story-design.md §5 / DU-FE-501

## 任务清单

- [ ] 任务 1 — api/search.ts 与 stores/search.ts（三态/竞态）（verifies: TC-006）
- [ ] 任务 2 — Header/HomeView 搜索框回车跳 /search?keyword=（verifies: TC-001）
- [ ] 任务 3 — SearchView 结果列表（卡片字段映射/跳详情）与关键词回显（verifies: TC-001, TC-004）
- [ ] 任务 4 — 筛选/排序/分页控件与 URL 双向同步（刷新还原）（verifies: TC-002）
- [ ] 任务 5 — 三态 UI（空态出口/Loading/Error 重试）（verifies: TC-003）
- [ ] 任务 6 — 价格元→分换算与非法区间前端拦截（verifies: TC-005）
- [ ] 任务 7 — type-check/lint/vitest/build 门禁（verifies: TC-007）

## Acceptance Criteria

- [ ] AC-001 — 搜索框回车进入 /search 回显关键词并展示结果卡片。
- [ ] AC-002 — 筛选/四排序/分页可用；URL query 完整反映状态，刷新一致。
- [ ] AC-003 — 空/加载/失败三态明确；失败态有返回首页/分类浏览出口与重试。
- [ ] AC-004 — 点卡片进入既有详情页正常渲染。
- [ ] AC-005 — 元输入正确换算分；非法区间即时提示不发请求。
- [ ] AC-006 — vitest 三态/query 同步通过；type-check/lint/build 通过。

## 执行顺序（Execution Order）

1. 任务 1 → 2/3 → 4 → 5 → 6 → 7。

## 并行度（Parallelization）

任务 2 与 5 可并行。

## Verification

- Unit: vitest（pinia store + router mock + mock 请求；竞态序）。
- Integration: N/A（前后端联调在 Integration Gate）。
- API: 消费 GET /api/mall/search/products，字段契约与 DU-BE-502 一致。
- Migration: N/A。
- Error Case: mock 503/断网 Error 态+重试；竞态仅末次落屏。
