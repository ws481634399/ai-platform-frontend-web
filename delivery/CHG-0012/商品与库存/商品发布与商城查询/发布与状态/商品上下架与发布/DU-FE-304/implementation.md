# DU Implementation — DU-FE-304

> DU 级实施记录（Actual Implementation，sdd-dev 绑定本 DU 产出）。实施正文归属本仓库。
> 本文件固定为 Actual Implementation（实际修改模块/文件、Commit、Task/DU Mapping、实现偏离、完成情况），
> 与 task-design.md / task-spec.md（Expected Implementation）分立，不得合并。

## 变更内容

在商品管理列表增加上架/下架操作按钮，调用后端 publish/unpublish 接口。

- `src/api/product/product.ts`：新增 `publish(id)` 调用 `POST /products/{id}/publish`、`unpublish(id)` 调用 `POST /products/{id}/unpublish`。
- `src/views/product/ProductListView.vue`：操作列增加「上架」（DRAFT/OFF_SALE 时显示）和「下架」（ON_SALE 时显示）按钮，带确认弹窗，成功后刷新列表。

## Commits

| Commit | DU | 消息 | 文件数 |
| --- | --- | --- | --- |
| d7f9034 | DU-FE-304 | feat(CHG-0012): 商品列表增加上架/下架操作 | 6 |

## Deviations

无。

## 自检

- [x] publish/unpublish API 客户端已新增
- [x] 列表操作列按状态显示上架/下架按钮
- [x] 操作带二次确认
- [x] 操作成功后刷新列表
- [x] pnpm type-check / build / test 通过
