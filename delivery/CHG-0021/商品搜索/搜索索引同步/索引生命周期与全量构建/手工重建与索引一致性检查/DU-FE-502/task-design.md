# DU Task Design — DU-FE-502

> 层级：实现仓（Repository）侧产物——Expected Implementation 之"怎么做"（DU 技术方案）。
> 权威 DU 划分：外部 story-design.md §5（SSOT）。

## 1. Goal

mall-admin 搜索索引运维页：索引状态、重建（确认/RUNNING 轮询）、一致性检查结果、最近任务。

## 2. Repository

repo-2（ai-platform-frontend：mall-admin）

## 3. Scope

- src/api/searchIndex.ts：rebuild、rebuildTasks、consistencyCheck、syncFailures（预留）。
- src/views/search/SearchIndexView.vue：
  - 状态卡（别名/物理索引/indexCount/productOnSaleCount）；
  - [重建索引]按钮 + 二次确认；RUNNING 禁用并轮询任务进度（indexed/total），收到 409 提示已有任务；
  - 一致性检查面板：两计数、missing/extra 表格（productId 列）、truncated 提示；
  - 最近任务表（taskNo/status/total/indexed/耗时/error_message）。
- 路由 /search/index 与菜单项（按既有 admin 动态菜单/权限指令范式，权限码 search:index:list/rebuild）。

## 4. Design References

- CHG-0021 requirement-design.md §4（admin 契约）；STORY-005-02-01-02 story-design §1/§2。

## 5. Dependencies

权威表：DU-BE-504。

## 6. Implementation Sketch

```
SearchIndexView(mounted) → loadTasks() + loadCheck()
[重建] click → confirm → api.rebuild()
   200 → enterPolling(taskNo): fakeTimers/setInterval 3s GET rebuildTasks until SUCCESS/FAILED
   409 → message.warning(返回的当前 taskId)
[一致性检查] → api.consistencyCheck() → 渲染计数与两张差集表（truncated 时提示）
```

## 7. Pseudocode

N/A — 页面以声明式渲染与简单轮询为主，无复杂状态机/算法，未命中 complexity-trigger（轮询状态转换在测试中以 fake timers 覆盖）。
