<template>
  <div class="admin-user-page">
    <!-- 当前页本地过滤（后端仅支持 page/size，无服务端搜索） -->
    <el-card
      class="filter-card"
      shadow="never"
    >
      <el-form
        :inline="true"
        @submit.prevent
      >
        <el-form-item label="用户名">
          <el-input
            v-model="store.adminKeyword"
            placeholder="仅过滤当前页"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="store.adminStatusFilter"
            placeholder="全部状态"
            clearable
            style="width: 140px"
          >
            <el-option
              label="启用"
              value="ENABLED"
            />
            <el-option
              label="禁用"
              value="DISABLED"
            />
            <el-option
              label="锁定"
              value="LOCKED"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button @click="store.resetAdminFilters()">
            重置过滤
          </el-button>
        </el-form-item>
        <el-form-item>
          <span class="filter-tip">筛选仅作用于当前页数据，不会发起查询</span>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never">
      <div class="toolbar">
        <el-button
          v-permission="'admin:create'"
          type="primary"
          :icon="Plus"
          data-testid="admin-create"
          @click="openCreate"
        >
          新建管理员
        </el-button>
      </div>

      <el-table
        v-loading="store.adminsLoading"
        :data="store.filteredAdmins"
        border
        stripe
        data-testid="admin-table"
      >
        <el-table-column
          prop="id"
          label="ID"
          width="120"
          align="center"
          class-name="tabular"
        />
        <el-table-column
          prop="username"
          label="用户名"
          min-width="180"
          show-overflow-tooltip
        />
        <el-table-column
          label="状态"
          width="100"
          align="center"
        >
          <template #default="{ row }">
            <el-tag
              :type="adminStatusTagType((row as AdminRow).status)"
              size="small"
            >
              {{ adminStatusLabel((row as AdminRow).status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          label="操作"
          width="260"
          align="center"
          fixed="right"
        >
          <template #default="{ row }">
            <el-button
              v-permission="'admin-role:assign'"
              link
              type="primary"
              :data-testid="`admin-assign-roles-${(row as AdminRow).id}`"
              @click="openRoleAssign(row as AdminRow)"
            >
              分配角色
            </el-button>
            <el-button
              v-permission="'admin:update'"
              link
              :type="(row as AdminRow).status === 'ENABLED' ? 'danger' : 'success'"
              :loading="togglingId === (row as AdminRow).id"
              :data-testid="`admin-toggle-${(row as AdminRow).id}`"
              @click="toggleStatus(row as AdminRow)"
            >
              {{ (row as AdminRow).status === 'ENABLED' ? '禁用' : '启用' }}
            </el-button>
            <el-button
              v-permission="'admin:update'"
              link
              type="primary"
              :data-testid="`admin-reset-password-${(row as AdminRow).id}`"
              @click="openPassword(row as AdminRow)"
            >
              重置密码
            </el-button>
          </template>
        </el-table-column>
        <template #empty>
          暂无管理员数据
        </template>
      </el-table>

      <div class="pager">
        <el-pagination
          v-model:current-page="store.adminPage"
          v-model:page-size="store.adminSize"
          :total="store.adminTotal"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>
    </el-card>

    <!-- 新建管理员对话框（409 等错误时保留） -->
    <el-dialog
      v-model="createVisible"
      title="新建管理员"
      width="460px"
      :close-on-click-modal="false"
      data-testid="admin-create-dialog"
    >
      <el-form
        label-width="90px"
        @submit.prevent
      >
        <el-form-item label="用户名">
          <el-input
            v-model="createForm.username"
            maxlength="64"
            placeholder="请输入用户名"
            data-testid="admin-create-username"
          />
        </el-form-item>
        <el-form-item label="初始密码">
          <el-input
            v-model="createForm.password"
            type="password"
            show-password
            maxlength="128"
            placeholder="请输入初始密码（强度要求同后端策略）"
            data-testid="admin-create-password"
            @keyup.enter="submitCreate"
          />
        </el-form-item>
        <el-alert
          v-if="createError"
          :title="createError"
          type="error"
          :closable="false"
          show-icon
          class="form-error"
          data-testid="admin-create-error"
        />
      </el-form>
      <template #footer>
        <el-button @click="createVisible = false">
          取消
        </el-button>
        <el-button
          type="primary"
          :loading="createSubmitting"
          data-testid="admin-create-submit"
          @click="submitCreate"
        >
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 重置密码对话框（提交时再二次确认） -->
    <el-dialog
      v-model="passwordVisible"
      title="重置密码"
      width="460px"
      :close-on-click-modal="false"
      data-testid="admin-password-dialog"
    >
      <el-form
        label-width="90px"
        @submit.prevent
      >
        <el-form-item label="管理员">
          <span class="dialog-target">{{ passwordTarget?.username }}</span>
        </el-form-item>
        <el-form-item label="新密码">
          <el-input
            v-model="passwordValue"
            type="password"
            show-password
            maxlength="128"
            placeholder="请输入新密码（强度要求同后端策略）"
            data-testid="admin-password-input"
          />
        </el-form-item>
        <el-alert
          v-if="passwordError"
          :title="passwordError"
          type="error"
          :closable="false"
          show-icon
          class="form-error"
          data-testid="admin-password-error"
        />
      </el-form>
      <template #footer>
        <el-button @click="passwordVisible = false">
          取消
        </el-button>
        <el-button
          type="primary"
          :loading="passwordSubmitting"
          data-testid="admin-password-submit"
          @click="submitPassword"
        >
          确定并二次确认
        </el-button>
      </template>
    </el-dialog>

    <!-- 分配角色对话框：按分页行 roleIds 回显，保存为全量覆盖 -->
    <el-dialog
      v-model="roleAssignVisible"
      title="分配角色"
      width="460px"
      :close-on-click-modal="false"
      data-testid="admin-roles-dialog"
    >
      <el-form
        label-width="90px"
        @submit.prevent
      >
        <el-form-item label="管理员">
          <span class="dialog-target">{{ roleAssignTarget?.username }}</span>
        </el-form-item>
        <el-form-item label="角色">
          <el-select
            v-model="roleAssignIds"
            multiple
            collapse-tags
            collapse-tags-tooltip
            placeholder="请选择角色"
            style="width: 100%"
            data-testid="admin-roles-select"
          >
            <el-option
              v-for="role in roleOptions"
              :key="role.id"
              :label="role.builtIn ? `${role.name}（内置）` : role.name"
              :value="role.id"
              :disabled="role.status !== 'ENABLED'"
            />
          </el-select>
        </el-form-item>
        <el-alert
          type="info"
          :closable="false"
          show-icon
          title="勾选为该管理员的完整角色快照，保存后将全量覆盖其现有角色。"
        />
        <el-alert
          v-if="roleAssignError"
          :title="roleAssignError"
          type="error"
          :closable="false"
          show-icon
          class="form-error"
          data-testid="admin-roles-error"
        />
      </el-form>
      <template #footer>
        <el-button @click="roleAssignVisible = false">
          取消
        </el-button>
        <el-button
          type="primary"
          :loading="roleAssignSubmitting"
          data-testid="admin-roles-submit"
          @click="submitRoleAssign"
        >
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import type { AdminRow } from '@/api/security'
import { adminStatusLabel, adminStatusTagType } from './security-display'
import { useAdminUsers } from './use-admin-users'

const {
  store,
  createVisible,
  createSubmitting,
  createForm,
  createError,
  openCreate,
  submitCreate,
  togglingId,
  toggleStatus,
  passwordVisible,
  passwordSubmitting,
  passwordTarget,
  passwordValue,
  passwordError,
  openPassword,
  submitPassword,
  roleAssignVisible,
  roleAssignSubmitting,
  roleAssignTarget,
  roleAssignIds,
  roleAssignError,
  roleOptions,
  openRoleAssign,
  submitRoleAssign,
} = useAdminUsers()

function handlePageChange(): void {
  void store.loadAdmins()
}

function handleSizeChange(): void {
  // 改变页大小后回到第一页
  store.adminPage = 1
  void store.loadAdmins()
}

onMounted(() => {
  void store.loadAdmins()
})
</script>

<style scoped>
.admin-user-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.filter-tip {
  color: var(--el-text-color-placeholder);
  font-size: 13px;
}

.toolbar {
  margin-bottom: 12px;
}

.pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.form-error {
  margin-top: 8px;
}

.dialog-target {
  font-weight: 600;
}
</style>
