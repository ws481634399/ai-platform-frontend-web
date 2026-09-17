# DU Task Design — DU-FE-903

> 层级：实现仓（Repository）侧产物——Expected Implementation 之"怎么做"（DU 技术方案）。
> 权威 DU 划分：外部 story-design.md §5（SSOT）。

## 1. Goal

mall-admin 订单管理：多条件检索列表、订单详情与状态轨迹、PAID 订单发货弹窗；动态菜单与 order:* 权限码接入。

## 2. Repository

repo-2（mall-admin）

## 3. Scope

- src/api/order.ts：`adminListOrders({orderNo,memberId,status,page,size,startAt,endAt})`、`adminGetOrder(orderNo)`、`shipOrder(orderNo,{deliveryCompany,trackingNo})`；类型与后端 admin 契约对齐。
- src/stores/orderAdmin.ts：query/page/records/total/detail/loading；ship action（成功后刷新详情）。
- views/order/OrderListView.vue：Element Plus Form（orderNo 输入、memberId 输入、status select 五状态、DatePicker 时间范围）；el-table 列 orderNo/memberId/状态 tag/payAmountFen/创建时间/操作（查看）；分页；查询/重置。
- views/order/OrderDetailView.vue：会员与基础信息、收货快照、商品表、金额、状态历史时间线；PAID 且 v-permission('order:ship') 显示"发货"按钮 → 弹窗表单（物流公司、运单号，必填 1–64，前端长度校验）；SHIPPED/COMPLETED 展示物流信息；ship 成功 message 成功并刷新。
- 路由与菜单：按 mall-admin 既有动态路由机制（后端菜单表 + 前端组件映射白名单）注册"订单管理/订单列表"目录项，权限标识 order:list（查看按钮 order:view、发货 order:ship 按指令控制）；component path 加入白名单映射（如 order/OrderList、order/OrderDetail）。
- 菜单种子：经 mall-admin 既有菜单 bootstrap/SQL 迁移方式写入（dev 实施时定位现有种子文件，evidence 记录）。

## 4. Design References

- requirement-design.md §2.8（前端方案）、§4.4 admin 契约；STORY-004-03-02-01 story-design.md repo-2 段。

## 5. Dependencies

权威表：DU-BE-905。前端基础设施依赖 M1（动态菜单/权限指令）。

## 6. Implementation Sketch

- 权限：v-permission 指令（既有）控制按钮；路由 meta 权限码；无权限账号菜单不可见，直接输 URL 由路由守卫拦截 + 接口 403 兜底。
- 查询参数空值清理（空字符串不下发）；时间范围 DatePicker 值转 ISO。
- 409/400 错误沿用全局 axios 拦截提示；发货冲突后重拉详情。
- 详情页可从列表新页签/抽屉进入——按既有 admin 页面惯例（路由跳转）。

## 7. Pseudocode

N/A。标准后台检索 + 表单弹窗页面，无复杂算法。
