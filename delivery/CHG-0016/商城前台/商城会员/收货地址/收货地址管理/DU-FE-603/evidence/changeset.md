# Changeset — DU-FE-603

> 仓库：repo-2（ai-platform-frontend / mall-web），分支 M3-dev。
> 代码提交见 commits.md（feat(mall-web): 收货地址管理页）。
> 共 10 个文件（8 新增 + 2 修改），无新增依赖、无 lockfile 变更。下文全量列出。

## 1. 新增：类型/API/规则/store/视图

| 文件 | 变更类型 |
|---|---|
| `mall-web/src/types/address.ts` | 新增（ShippingAddressView 无 memberId/id 字符串、AddressUpsertRequest、AddressListResponse、DefaultAddressResponse） |
| `mall-web/src/api/address.ts` | 新增（addressApi 六方法；setDefault=PUT /{id}/default；remove 204 不解包） |
| `mall-web/src/utils/address-form.ts` | 新增（validateAddressForm 与后端同界：32/手机正则/64/**详址128**/邮编6位；buildAddressRequest trim+邮编归一 null；toFormValues；ADDRESS_LIMIT=20） |
| `mall-web/src/stores/address.ts` | 新增（pinia member-address：列表缓存/force 强拉/写后强拉/setDefault 乐观+回滚重拉/reset，reachLimit/hasDefault） |
| `mall-web/src/views/member/AddressListView.vue` | 新增（列表/空态/默认徽标、新增编辑同弹层行内错误不关层、删除 confirm、乐观设默认、上限提示、全 data-testid） |

## 2. 新增：测试（21 例）

| 文件 | 变更类型 |
|---|---|
| `mall-web/src/api/address.spec.ts` | 新增（6 例：六方法端点/解包/204/{item:null}） |
| `mall-web/src/utils/address-form.spec.ts` | 新增（9 例：全字段边界 32/64/128/手机/邮编 + build/toFormValues/LIMIT） |
| `mall-web/src/stores/address.spec.ts` | 新增（6 例：缓存/写后强拉/409 不污染/乐观时点/409 回滚重拉/reset） |

## 3. 修改：路由/布局

| 文件 | 变更类型 |
|---|---|
| `mall-web/src/router/index.ts` | 修改（MallLayout 子路由 /member/addresses，requiresMember:true） |
| `mall-web/src/layouts/MallLayout.vue` | 修改（登录态头部增「收货地址」入口链接及样式） |
