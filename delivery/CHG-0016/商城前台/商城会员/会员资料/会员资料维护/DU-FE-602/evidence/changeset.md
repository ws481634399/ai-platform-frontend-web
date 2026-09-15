# Changeset — DU-FE-602

> 仓库：repo-2（ai-platform-frontend / mall-web），分支 M3-dev。
> 代码提交见 commits.md（feat(mall-web): 个人中心资料页）。
> 共 11 个文件（7 新增 + 4 修改），无新增依赖、无 lockfile 变更。下文全量列出。

## 1. 新增：类型/API/规则/视图

| 文件 | 变更类型 |
|---|---|
| `mall-web/src/types/member.ts` | 新增（MemberGender/MemberProfile/UpdateMemberProfileRequest/AvatarUploadResult） |
| `mall-web/src/api/member.ts` | 新增（memberApi.getProfile/updateProfile/uploadAvatar；FormData part=file；30s 超时） |
| `mall-web/src/utils/profile-form.ts` | 新增（validateProfileForm 字段校验 + validateAvatarFile 类型/2MB 预拦截，常量与后端同界） |
| `mall-web/src/views/member/ProfileView.vue` | 新增（资料表单 + diff 保存 + 头像预览上传 + 加载/错误态 + data-testid） |

## 2. 新增：测试（15 例）

| 文件 | 变更类型 |
|---|---|
| `mall-web/src/utils/profile-form.spec.ts` | 新增（8 例：昵称/手机/邮箱/性别矩阵 + 头像类型与 2MB 边界） |
| `mall-web/src/api/member.spec.ts` | 新增（3 例：GET 解包、PUT 部分更新体、FormData part=file 契约） |
| `mall-web/src/stores/profile.spec.ts` | 新增（4 例：缓存拉取、保存成败、头像成败、空缓存与 clear） |

## 3. 修改：store/路由/布局/工程配置

| 文件 | 变更类型 |
|---|---|
| `mall-web/src/stores/member.ts` | 修改（profile 内存态 + fetchProfile/saveProfile/changeAvatar；clear 连带清资料） |
| `mall-web/src/router/index.ts` | 修改（MallLayout 子路由 /member/profile，requiresMember:true） |
| `mall-web/src/layouts/MallLayout.vue` | 修改（登录态头部增「个人中心」入口链接） |
| `mall-web/eslint.config.js` | 修改（**/*.vue 关闭 no-undef，DEV-2） |
