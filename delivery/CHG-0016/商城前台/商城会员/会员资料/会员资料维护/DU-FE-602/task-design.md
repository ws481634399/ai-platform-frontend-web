# DU Task Design — DU-FE-602

> 层级：实现仓（Repository）侧产物——Expected Implementation 之"怎么做"（DU 技术方案）。
> 权威 DU 划分：外部 story-design.md §5（SSOT）。

## 1. Goal

mall-web 个人中心资料页：资料查看/编辑保存、头像本地预览上传与成功/失败提示。

## 2. Repository

repo-2（ai-platform-frontend / mall-web）

## 3. Scope

- api/member.ts：getProfile/updateProfile/uploadAvatar（multipart FormData）类型。
- views/member/ProfileView.vue：表单（昵称/手机/邮箱）、与后端一致的前端校验、保存 loading 与字段错误展示；头像组件（选择→本地 URL.createObjectURL 预览→提交→成功刷新 store 中 avatarUrl；失败 toast）；超过 2MB 前端预拦截。
- stores/auth 或独立 member store：当前资料缓存与更新。
- 路由：/member/profile 挂 requiresMember（守卫来自 DU-FE-601）。

## 4. Design References

- CHG-0016 requirement-design.md §3.1（mall-web 架构）、§4（/me 契约）；STORY-003-01-02-01 story-design.md §1 repo-2 段。

## 5. Dependencies

DU-BE-603（资料/头像端点）；页面鉴权依赖 DU-FE-601 守卫。

## 6. Implementation Sketch

- 挂载拉取 GET /me 填充表单；保存 PUT 仅提交变更字段；400 字段错误映射到表单项。
- 头像：input accept="image/png,image/jpeg,image/webp"；选后校验 size≤2MB 与类型 → 预览 → 调上传 → 200 后更新本地资料；503/400 toast 文案。
- 组件 vitest：mock api 成功/失败两路径；三检（vue-tsc/eslint/build）。

## 7. Pseudocode

N/A（metadata `pseudocode: false`）。表单/上传为标准交互编排。
