# DU Task Design — DU-FE-503

> 层级：实现仓（Repository）侧产物——Expected Implementation 之"怎么做"（DU 技术方案）。
> 权威 DU 划分：外部 story-design.md §5（SSOT）。

## 1. Goal

mall-admin 功能开关/系统参数/变更历史三页面：列表分组、启停、类型化编辑（范围提示）、乐观锁冲突提示、历史筛选对比。

## 2. Repository

repo-2（ai-platform-frontend：mall-admin）

## 3. Scope

- src/api/config.ts：featureConfigs/systemParameters/configHistory 三组接口（分页/CRUD/启停）。
- views/config/FeatureConfigsView.vue：分组列表、enabled 开关（内置键 key 字段只读）、编辑弹窗、删除（内置禁用）、409 版本冲突提示并刷新。
- views/config/SystemParametersView.vue：按 parameterType 渲染（boolean switch、number 带 min/max 提示、string、json textarea 带格式校验）、effectType 标识展示。
- views/config/ConfigHistoryView.vue：configType+configKey 筛选、分页、旧值/新值对比、operator/reason/时间列。
- 路由与菜单（权限指令 v-perms：system:feature:* / system:parameter:* / system:config-history:list）。

## 4. Design References

- CHG-0022 requirement-design.md §4（admin 契约）；STORY-006-01-01-01 story-design §1/§2。

## 5. Dependencies

权威表：DU-BE-507。

## 6. Implementation Sketch

```
列表页(onMounted) → api.list(group,page)
  ├─ 开关切换 → update({...,version}) → 成功刷新；409 → alert 冲突→重新拉取
  └─ 编辑弹窗 → 按类型表单校验（前端同构 min/max/JSON）→ submit
历史页 → 筛选 change → api.history(type,key,page) → 对比表
```

## 7. Pseudocode

N/A — 标准后台 CRUD 页面，校验规则为表单声明式配置，无算法/状态机复杂度，未命中 complexity-trigger。
