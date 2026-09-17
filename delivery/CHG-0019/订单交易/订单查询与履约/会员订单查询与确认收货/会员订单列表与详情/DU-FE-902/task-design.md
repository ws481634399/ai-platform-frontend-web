# DU Task Design — DU-FE-902

> 层级：实现仓（Repository）侧产物——Expected Implementation 之"怎么做"（DU 技术方案）。
> 权威 DU 划分：外部 story-design.md §5（SSOT）。

## 1. Goal

mall-web 会员订单中心：列表（Tab/分页/空态）、详情（快照/物流/状态时间线）、待支付支付取消与待收货确认操作。

## 2. Repository

repo-2（mall-web）

## 3. Scope

- src/api/order.ts 扩展：`listOrders({status,page,size,startAt,endAt})`、`getOrder(orderNo)`、`payOrder(orderNo)`、`cancelOrder(orderNo,reason?)`、`confirmReceipt(orderNo)`；OrderSummary/Detail/History/Receiver/Page 类型。
- src/stores/order.ts 扩展：ordersPage{records,total,page,size,status,loading}、fetchList（Tab 切换重置 page=1）、fetchDetail、pay/cancel/confirm actions（操作中按钮 loading，成功后重拉详情）。
- views/order/OrderListView.vue：Tab 常量 [{key:'',label:'全部'},PENDING_PAYMENT 待支付,PAID 待发货,SHIPPED 待收货,COMPLETED 已完成,CANCELLED 已取消]；Element Plus 分页；行卡（firstItem 图/名/规格、itemCount、payAmountFen 格式化、状态 tag）；空态插画+去逛逛；点击行/router-link 进详情。
- views/order/OrderDetailView.vue：状态头（状态文案+操作按钮组）；收货地址卡；商品表；金额明细；物流卡（SHIPPED/COMPLETED 显示 company/trackingNo）；状态历史 el-timeline（operation 文案映射 CREATE 创建/PAY 支付/CANCEL 取消/SHIP 发货/CONFIRM_RECEIT 确认收货 + occurredAt）；404 态。
- 操作：支付（confirm 二次确认"模拟支付将直接扣款"）；取消（弹层原因 textarea 可选≤255）；确认收货（二次确认）；统一捕获 409 B0407 → 提示"订单状态已变更"后 fetchDetail。
- 路由：/orders、/orders/:orderNo meta.requiresAuth；会员中心菜单/入口（Layout 侧边或用户菜单，实施按现有结构）。

## 4. Design References

- requirement-design.md §2.8（前端方案）、§4.3/§4.4 契约；STORY-004-03-01-01/02 story-design.md repo-2 段。

## 5. Dependencies

权威表：DU-FE-901、DU-BE-904；操作按钮依赖 DU-BE-903/905 后端上线（前端可先行 mock）。

## 6. Implementation Sketch

- 金额：统一 formatFen（分→元，两位小数）；ID 均字符串透传不 parse。
- Tab 查询：status='' 不传参；分页器 v-model:current-size 变化触发 fetchList；query 同步 status/page 到 URL（可选，实施时按列表页既有惯例）。
- 操作防重复：actionLoading map keyed by orderNo+action。
- 时间：Instant/ISO 字符串用 dayjs/既有格式化器展示本地时间。

## 7. Pseudocode

N/A。标准列表/详情 CRUD 页面，分支由状态枚举映射表驱动，无复杂算法。
