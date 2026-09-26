# DU Implementation — DU-FE-003

> DU 级实施记录（Actual Implementation，sdd-dev 绑定本 DU 产出）。实施正文归属本仓库。
> 本文件固定为 Actual Implementation（实际修改模块/文件、Commit、Task/DU Mapping、实现偏离、完成情况），
> 与 task-design.md / task-spec.md（Expected Implementation）分立，不得合并。

## 变更内容

- 补偿 API（src/api/order/order.ts）：page 增加 operation/aggregateId 查询参数（空白忽略）；新增 complete(id) POST /{id}/complete；CompensationView 增加 payload、traceId 字段。
- CompensationListView.vue：
  - 筛选区新增操作类型下拉（CONFIRM_INVENTORY/RELEASE_INVENTORY/AUTO_CANCEL_ORDER）与聚合 ID 输入（回车/清空触发查询）。
  - 表格新增「载荷」列，弹窗 JSON 美化查看（非法 JSON 回退原文）。
  - 重试按钮权限码更新 system:compensation:retry。
  - 新增「标记完成」：el-popconfirm 二次确认 + v-permission system:compensation:complete + data-testid="compensation-complete"；ElMessage.success('已标记完成') 并刷新。
  - 页头 RocketMQ Dashboard 外链（VITE_ROCKETMQ_DASHBOARD_URL，未配置不渲染）。

## Commits

- "5425717"（T1）：补偿 API operation/aggregateId + complete；payload/traceId 字段
- "344fefd"（T2）：操作类型下拉 + 聚合 ID 输入筛选
- "93a7ff2"（T3）：payload 查看 + 重试权限码 + 标记完成
- "5ce2ad0"（T4）：RocketMQ Dashboard 外链
- T5：全量回归执行，无源码变更，无独立提交

## Deviations

无。

## 自检

- `npx vitest run`：**33 个测试文件 / 134 个用例全部通过**（基线 31 文件，本 DU 新增 2 文件：src/api/order/order.spec.ts、src/views/order/CompensationListView.contract.spec.ts）。
- 既有页面/路由零回退。
