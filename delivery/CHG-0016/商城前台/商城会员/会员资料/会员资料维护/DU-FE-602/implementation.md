# DU Implementation — DU-FE-602

> DU 级实施记录（Actual Implementation，sdd-dev 绑定本 DU 产出）。实施正文归属本仓库。
> 本文件固定为 Actual Implementation（实际修改模块/文件、Commit、Task/DU Mapping、实现偏离、完成情况），
> 与 task-design.md / task-spec.md（Expected Implementation）分立，不得合并。

## 变更内容

mall-web 个人中心资料页（CHG-0016 STORY-003-01-02-01），全部在 repo-2 mall-web，
后端端点由 DU-BE-603 提供（GET/PUT `/api/mall/members/me`、POST `/api/mall/members/me/avatar`）。

1. **类型与 API 层**：
   - `src/types/member.ts`：MemberGender（UNKNOWN/MALE/FEMALE 对齐后端枚举）、MemberProfile
     （memberId 字符串、avatarUrl/phone/email 可 null）、UpdateMemberProfileRequest（null=保留/空串=清空）、
     AvatarUploadResult。
   - `src/api/member.ts`：memberApi.getProfile/updateProfile/uploadAvatar，复用唯一 HTTP 出口
     `@/api/http`（Bearer 注入与 401 单飞重放自动覆盖新端点）；头像以 FormData、part 名固定 `file`，
     不手动设 Content-Type（浏览器自动带 boundary），上传超时放宽 30s。
2. **资料缓存接入既有 member store**（不另开 store）：`stores/member.ts` 增内存态 `profile`
   与 fetchProfile/saveProfile/changeAvatar 三动作——成功以服务端视图整体替换缓存，
   失败不污染缓存；changeAvatar 仅在缓存存在时同步 avatarUrl；clear() 连带清资料。
3. **表单规则 `src/utils/profile-form.ts`**（与后端同界）：昵称 trim 后 1–32；
   手机空串=清空/非空 `^1[3-9]\d{9}$`；邮箱空串=清空/非空宽松正则且 ≤128；性别枚举白名单；
   头像 MIME 白名单 jpeg/png/webp + ≤2MB（AVATAR_MAX_BYTES 常量同 2\*1024\*1024）。
   前置校验仅为体验，服务端魔数/正则是安全边界。
4. **页面 `src/views/member/ProfileView.vue`**（路由 `/member/profile`，meta.requiresMember）：
   - 挂载即 fetchProfile 回填，加载中/加载失败（透传后端 message，如 401 一致性提示）两态；
   - 用户名只读 disabled；昵称/性别（保密/男/女 select）/手机/邮箱表单 + 字段级错误；
   - 保存：前端校验 → 与已加载视图逐字段 diff，**只提交变更字段**，手机/邮箱清空显式提交空串，
     无变更提示「资料无变更」；成功「资料已保存」，失败红字透传文案且缓存不被污染；
   - 头像：`accept="image/jpeg,image/png,image/webp"`，选择即类型/大小预拦截（超限/伪装不发请求），
     URL.createObjectURL 本地预览，上传中禁用输入；成功刷新 store 中 avatarUrl 并 revoke 预览，
     失败保留旧头像与预览、红字提示（503 透传「头像存储暂不可用，请稍后重试」）；
     组件卸载 revoke 防泄漏。全部交互点带 data-testid 供浏览器联调定位。
5. **路由与布局**：`router/index.ts` 在 MallLayout 子路由挂 member-profile（requiresMember:true，
   未登录由 DU-FE-601 守卫带 redirect 跳登录）；`MallLayout.vue` 登录态增「个人中心」入口。
6. **工程配置**：`eslint.config.js` 对 `**/*.vue` 关闭核心 `no-undef`（SFC TS 由 vue-tsc 检查，
   typescript-eslint 官方建议，见 DEV-2）。
7. **测试（新增 15 例，vitest 37/37；无新增依赖）**：
   - `utils/profile-form.spec.ts` 8 例：昵称空/32/33 边界、手机清空与错号段、
     邮箱清空/非法/128/129 边界、性别枚举、头像类型白名单与 2MB 边界（含伪装 gif）；
   - `api/member.spec.ts` 3 例：GET 解包字符串 memberId/null 字段、PUT 部分更新体、
     头像 FormData 断言 part=file 与 30s 超时；
   - `stores/profile.spec.ts` 4 例：拉取缓存、保存成功替换/失败不污染、
     头像成功同步/失败保留旧 URL、空缓存上传不构造脏 profile、clear 清资料。

详细文件清单见 evidence/changeset.md，红/绿与 TC 映射见 evidence/red-green.md。

## Commits

| Commit | 说明 |
|---|---|
| c20c24c6230790a8bd5af70571e2165a1d67ff64 | feat(mall-web): 个人中心资料页（GET/PUT /me 表单与头像预览上传，DU-FE-602 全部代码/配置/测试，11 文件） |

## Deviations

<!-- 实现与 DU 建议（Sketch / Pseudocode）明显偏离时必须记录；无偏离写「无」。 -->

### DEV-1 「组件 vitest」落为逻辑切片 vitest，不引入 DOM 挂载栈

- 原 DU 建议: task-spec 任务 4 写「vitest 组件测试（mock api 成功/400/503）」。
- 实际实现: 未新增 @vue/test-utils/happy-dom 依赖；可测逻辑下沉 utils/api/store 三切片
  （15 例，mock api 成功/400/503 路径在 store 与 api spec 锁定），SFC 仅做交互编排。
- 原因: DU-FE-601 已确立 mall-web 测试惯例——6 个 spec 全部纯逻辑层（node 环境），
  视图不挂载；为单页引入 DOM 测试栈需在 frozen-lockfile 环境更新锁文件，收益不抵面扩张。
- 影响评估: 字段校验矩阵、FormData part 契约、缓存成功/失败语义均有自动化断言；
  真实点击/预览/提示与两进程链路按 test-design §4 归 M3 Test 浏览器集成场景；
  页面可编译性与模板类型由 vue-tsc + vite build 兜底。

### DEV-2 ESLint 对 Vue SFC 关闭 no-undef

- 原 DU 建议: 未提及（task 阶段未预见）。
- 实际实现: flat config 的 `**/*.vue` 块增 `rules: { 'no-undef': 'off' }`。
- 原因: SFC `<script lang="ts">` 虚拟文件不套用 TS 源码的 globals/类型信息，
  核心 no-undef 把 URL/Event/HTMLInputElement 误判为未定义（4 errors）；typescript-eslint
  官方文档明确 TS 代码不应使用 no-undef（未定义符号由编译器检查）。
- 影响评估: 仅对 .vue 关闭、.ts 规则不变；vue-tsc 双 tsconfig type-check 0 错误，
  真实未定义引用仍无法过编译。

### DEV-3 保存仅发 diff 字段；头像失败保留本地预览

- 原 DU 建议: task-design §6「保存 PUT 仅提交变更字段；上传失败 toast」。
- 实际实现: 按 sketch 落地逐字段 diff（trim 归一；手机/邮箱清空显式空串）；头像失败时
  不 revoke 本地预览、不清输入前保留旧头像展示，允许用户直接重试或重选。
- 原因: 部分更新契约 null=保留，前端 diff 后请求体最小且语义无歧义；失败立即撤预览会让用户
  失去「所选图仍在、可重试」的上下文。
- 影响评估: 无变更不发请求（「资料无变更」提示）；组件卸载统一 revoke，无 objectURL 泄漏。

## 自检

- [x] 单元测试：`pnpm test` → 9 文件 **37/37**（基线 22 + 本 DU 15），日志 evidence/logs/fe-test-run1.log。
- [x] 类型检查：`pnpm type-check` → vue-tsc 双 tsconfig 0 错误，日志 fe-typecheck-run1.log。
- [x] Lint：`pnpm lint` → **0 errors** / 92 warnings（均为既有降级样式规则，基线 56 + 新页 36），日志 fe-lint-run1.log。
- [x] 构建：`pnpm build` → 成功，ProfileView 路由级分包（6.00 kB / gzip 2.43 kB），日志 fe-build-run1.log。
- [x] 契约对齐：memberId 仅来自 GET 视图（页面无入参 ID、用户名只读）；PUT 部分更新；
      multipart part=file、超时 30s；错误文案经 resolveErrorMessage 透传（400/503 同后端中文）。
- [x] 安全/体验：超限与非白名单类型前端零请求拦截；真正校验仍以后端魔数为准；
      /member/profile 挂 requiresMember，未登录经 DU-FE-601 守卫带 redirect 跳登录。
- [x] 无新增运行时/开发依赖（未改 package.json 与 lockfile）。
