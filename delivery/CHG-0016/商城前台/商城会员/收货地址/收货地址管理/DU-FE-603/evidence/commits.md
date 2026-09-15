# Commits — DU-FE-603

> 仓库：repo-2（implementation/ai-platform-frontend），分支 M3-dev。
> 基线：2a59552（DU-FE-602 收尾 chore(sdd) 后 HEAD）。

| Commit（完整 hash） | 类型 | 说明 |
|---|---|---|
| 6a10cdd2de3d5b317bdc1022cad8382e2e4b70b5 | feat | 收货地址管理页（列表/默认徽标/新增编辑弹层/删除确认/乐观设默认，DU-FE-603 全部代码与测试，10 文件 21 例） |

提交内容对应 evidence/changeset.md 的全量文件清单：
- 新增 5 产品文件（types/address、api/address、utils/address-form、stores/address、
  views/member/AddressListView）；
- 新增 3 测试文件 21 例；修改 router（/member/addresses 守卫）、MallLayout（收货地址入口）。

验证：该提交对应工作树 `pnpm test` **58/58**、`pnpm type-check` 0 错误、
`pnpm lint` 0 errors、`pnpm build` 成功（见 evidence/logs/ 四份日志）。
