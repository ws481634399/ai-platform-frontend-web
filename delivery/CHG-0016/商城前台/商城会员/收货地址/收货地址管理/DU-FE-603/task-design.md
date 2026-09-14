# DU Task Design — DU-FE-603

> 层级：实现仓（Repository）侧产物——Expected Implementation 之"怎么做"（DU 技术方案）。
> 权威 DU 划分：外部 story-design.md §5（SSOT）。

## 1. Goal

mall-web 地址管理页：列表（默认置顶）、新增/编辑/删除/设默认全流程、空态与错误提示。

## 2. Repository

repo-2（ai-platform-frontend / mall-web）

## 3. Scope

- api/address.ts：list/create/update/remove/setDefault/getDefault 类型（id 字符串）。
- views/member/AddressView.vue + AddressForm 组件：列表排序展示与默认徽标；表单校验（收货人/手机号/省市区/详细地址 ≤200/邮编 6 位）；新增/编辑复用；删除二次确认；设默认乐观更新+失败回滚；空态引导新增；409 ADDRESS_LIMIT 与 400 字段错误 toast/行内提示。
- 路由 /member/addresses 挂 requiresMember。

## 4. Design References

- CHG-0016 requirement-design.md §3.1、§4（地址契约）；STORY-003-01-03-01 story-design.md §1 repo-2 段。

## 5. Dependencies

DU-BE-604（地址端点）；守卫依赖 DU-FE-601。

## 6. Implementation Sketch

- 进入拉列表；本地不再排序（信任后端 is_default/updated_at 顺序）。
- 设默认：按钮置 loading，成功本地重排，失败 toast 并重拉。
- 表单：手机号/邮编前端正则与错误码文案一致；提交 400 映射字段；409 显示"最多 20 条"。
- vitest：mock api 全流程 + 三检。

## 7. Pseudocode

N/A（metadata `pseudocode: false`）。标准 CRUD 交互。
