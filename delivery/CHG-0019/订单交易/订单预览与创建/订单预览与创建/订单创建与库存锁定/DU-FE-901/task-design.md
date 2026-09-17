# DU Task Design — DU-FE-901

> 层级：实现仓（Repository）侧产物——Expected Implementation 之"怎么做"（DU 技术方案）。
> 权威 DU 划分：外部 story-design.md §5（SSOT）。

## 1. Goal

mall-web 结算确认页：预览展示、地址选择、不可下单阻断、防双击提交、成功清车跳详情，购物车与商品详情两入口接线。

## 2. Repository

repo-2（mall-web）

## 3. Scope

- src/api/order.ts：`previewOrder(body)` POST /api/mall/orders/preview、`createOrder(body)` POST /api/mall/orders；TS 类型 PreviewView/PreviewItem/CreateRequest/OrderDetailView 与后端逐字段（字符串 ID、*Fen）。
- src/stores/order.ts（pinia）：state preview/submit/error；actions fetchPreview/submit/reset；submit 进行中置 submitting 禁入第二次。
- src/views/checkout/CheckoutView.vue：onMounted 解析 route.query（source 必为 CART/BUY_NOW；BUY_NOW 需 skuId/quantity）调 preview；顶部地址区（复用 src/api/shipping-address 或 member address api 列表；默认 isDefault；未选禁用提交）；商品行卡片（图/名/规格/数量/单价/小计/库存状态文案与 issueCodes 原因）；金额明细（goods/discount/freight/pay fen→元格式化，复用全局 formatFen）；底部提交条。
- 提交：createOrder({submitToken,addressId,source,items})；成功 store 写 currentOrder → CART：await cartStore.removeItems(skuIds)（失败提示但仍跳详情）→ router.replace(`/orders/${orderNo}`)；BUY_NOW 直接跳。
- 入口：购物车页选中后"去结算"按钮 push /checkout?source=CART；ProductDetailView SKU 选定后"立即购买" push /checkout?source=BUY_NOW&skuId=&quantity=；路由表 /checkout meta.requiresAuth（既有守卫机制，实施时核对）。
- 失败：B0406/409 等提示"下单信息已失效，请重新确认"并重新 preview；503 依赖不可用提示稍后重试。

## 4. Design References

- requirement-design.md §2.8（前端方案）、§4.1/4.2 契约；STORY-004-01-01-02 story-design.md §1 repo-2 段。

## 5. Dependencies

权威表：DU-BE-902。前端既有：cart store/api（CHG-0018）、地址 api（CHG-0015/会员模块）、登录守卫与 formatFen。

## 6. Implementation Sketch

- 状态机：preview:{loading,data,error}；submit:{status:idle|submitting|done|error,message}；提交按钮 :disabled="!availableToSubmit || !addressId || submitting"。
- 地址选择在预览数据返回 address 之外允许切换（拉地址列表）；切换地址触发重新 preview（保证 submitToken 与地址一致——后端指纹校验）。
- query 非法（BUY_NOW 缺 skuId）→ 错误页/返回上一页引导。
- 组件样式沿用 mall-web 既有风格（Element Plus 或现有组件库，实施时以项目为准）。

## 7. Pseudocode

N/A。页面为数据拉取→渲染→提交直线流程，分支由 store 状态与后端 availableToSubmit 驱动，无复杂算法。
