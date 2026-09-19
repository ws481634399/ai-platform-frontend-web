<template>
  <div class="role-page">
    <el-card shadow="never">
      <div class="toolbar">
        <el-button
          v-permission="'role:create'"
          type="primary"
          :icon="Plus"
          data-testid="role-create"
          @click="openCreate"
        >
          新建角色
        </el-button>
      </div>

      <el-table
        v-loading="store.rolesLoading"
        :data="store.roles"
        border
        stripe
        data-testid="role-table"
      >
        <el-table-column
          prop="id"
          label="ID"
          width="100"
          align="center"
          class-name="tabular"
        />
        <el-table-column
          prop="code"
          label="角色编码"
          min-width="160"
          show-overflow-tooltip
        />
        <el-table-column
          prop="name"
          label="角色名称"
          min-width="140"
          show-overflow-tooltip
        />
        <el-table-column
          prop="description"
          label="描述"
          min-width="200"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            {{ (row as RoleRow).description || '—' }}
          </template>
        </el-table-column>
        <el-table-column
          label="状态"
          width="90"
          align="center"
        >
          <template #default="{ row }">
            <el-tag
              :type="rbacStatusTagType((row as RoleRow).status)"
              size="small"
            >
              {{ rbacStatusLabel((row as RoleRow).status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          label="类型"
          width="90"
          align="center"
        >
          <template #default="{ row }">
            <el-tag
              :type="(row as RoleRow).builtIn ? 'warning' : 'info'"
              size="small"
              effect="plain"
            >
              {{ (row as RoleRow).builtIn ? '内置' : '自定义' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          label="操作"
          width="240"
          align="center"
          fixed="right"
        >
          <template #default="{ row }">
            <el-button
              v-permission="'role:update'"
              link
              type="primary"
              :data-testid="`role-edit-${(row as RoleRow).id}`"
              @click="openEdit(row as RoleRow)"
            >
              编辑
            </el-button>
            <el-button
              v-permission="'role-permission:assign'"
              link
              type="primary"
              :data-testid="`role-auth-${(row as RoleRow).id}`"
              @click="openAuthorization(row as RoleRow)"
            >
              权限分配
            </el-button>
            <el-button
              v-permission="'role:delete'"
              link
              type="danger"
              :loading="deletingId === (row as RoleRow).id"
              :data-testid="`role-delete-${(row as RoleRow).id}`"
              @click="remove(row as RoleRow)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
        <template #empty>
          暂无角色数据
        </template>
      </el-table>
    </el-card>

    <!-- 新建/编辑角色对话框（409 等错误时保留） -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEditing() ? '编辑角色' : '新建角色'"
      width="480px"
      :close-on-click-modal="false"
      data-testid="role-dialog"
    >
      <el-form
        label-width="90px"
        @submit.prevent
      >
        <el-form-item label="角色编码">
          <el-input
            v-model="form.code"
            maxlength="64"
            placeholder="如：OPS_AUDITOR"
            :disabled="isEditing()"
            data-testid="role-form-code"
          />
        </el-form-item>
        <el-form-item label="角色名称">
          <el-input
            v-model="form.name"
            maxlength="64"
            show-word-limit
            placeholder="请输入角色名称"
            data-testid="role-form-name"
          />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            maxlength="255"
            show-word-limit
            placeholder="不超过 255 个字符，可留空"
            data-testid="role-form-description"
          />
        </el-form-item>
        <el-form-item
          v-if="isEditing()"
          label="状态"
        >
          <el-select
            v-model="form.status"
            style="width: 160px"
            data-testid="role-form-status"
          >
            <el-option
              label="启用"
              value="ENABLED"
            />
            <el-option
              label="禁用"
              value="DISABLED"
            />
          </el-select>
        </el-form-item>
        <el-alert
          v-if="dialogError"
          :title="dialogError"
          type="error"
          :closable="false"
          show-icon
          class="form-error"
          data-testid="role-form-error"
        />
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">
          取消
        </el-button>
        <el-button
          type="primary"
          :loading="dialogSubmitting"
          data-testid="role-form-submit"
          @click="submitForm"
        >
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 权限分配抽屉：按 GET /roles 出参 menuIds/permissionIds 回显，保存全量覆盖 -->
    <el-drawer
      v-model="drawerVisible"
      :title="`权限分配 - ${authRole?.name ?? ''}`"
      size="520px"
      :close-on-click-modal="false"
      destroy-on-close
      data-testid="role-auth-drawer"
    >
      <div class="auth-body">
        <el-alert
          type="info"
          :closable="false"
          show-icon
          title="勾选为该角色的完整授权快照，保存后将全量覆盖其现有菜单与权限。"
        />

        <section class="auth-section">
          <h3 class="auth-section__title">
            菜单授权
          </h3>
          <el-tree
            ref="menuTreeRef"
            v-loading="store.menusLoading"
            :data="menuTree"
            node-key="id"
            show-checkbox
            default-expand-all
            :default-checked-keys="checkedMenuIds"
            :props="{ label: 'name', children: 'children' }"
            data-testid="role-auth-menu-tree"
            @check="syncCheckedMenus"
          >
            <template #default="{ data }">
              <span class="menu-node">
                <span class="menu-node__name">{{ (data as MenuTreeNode).name }}</span>
                <el-tag
                  :type="menuTypeTagType((data as MenuTreeNode).type)"
                  size="small"
                  effect="plain"
                >
                  {{ menuTypeLabel((data as MenuTreeNode).type) }}
                </el-tag>
                <span
                  v-if="(data as MenuTreeNode).path"
                  class="menu-node__meta"
                >{{ (data as MenuTreeNode).path }}</span>
                <span
                  v-if="(data as MenuTreeNode).componentKey"
                  class="menu-node__meta"
                >{{ (data as MenuTreeNode).componentKey }}</span>
                <span
                  v-if="(data as MenuTreeNode).permissionCode"
                  class="menu-node__code"
                >{{ (data as MenuTreeNode).permissionCode }}</span>
              </span>
            </template>
          </el-tree>
        </section>

        <section class="auth-section">
          <h3 class="auth-section__title">
            按钮权限点
          </h3>
          <el-checkbox-group
            v-model="checkedPermissionIds"
            class="permission-grid"
            data-testid="role-auth-button-permissions"
          >
            <el-checkbox
              v-for="permission in permissionGroups.BUTTON"
              :key="permission.id"
              :value="permission.id"
              :disabled="permission.status !== 'ENABLED'"
            >
              {{ permission.name }}
              <span class="permission-code">{{ permission.code }}</span>
            </el-checkbox>
            <p
              v-if="permissionGroups.BUTTON.length === 0"
              class="empty-hint"
            >
              暂无按钮权限点
            </p>
          </el-checkbox-group>
        </section>

        <section class="auth-section">
          <h3 class="auth-section__title">
            接口权限点
          </h3>
          <el-checkbox-group
            v-model="checkedPermissionIds"
            class="permission-grid"
            data-testid="role-auth-api-permissions"
          >
            <el-checkbox
              v-for="permission in permissionGroups.API"
              :key="permission.id"
              :value="permission.id"
              :disabled="permission.status !== 'ENABLED'"
            >
              {{ permission.name }}
              <span class="permission-code">{{ permission.code }}</span>
            </el-checkbox>
            <p
              v-if="permissionGroups.API.length === 0"
              class="empty-hint"
            >
              暂无接口权限点
            </p>
          </el-checkbox-group>
        </section>

        <el-alert
          v-if="drawerError"
          :title="drawerError"
          type="error"
          :closable="false"
          show-icon
          class="form-error"
          data-testid="role-auth-error"
        />
      </div>
      <template #footer>
        <div class="drawer-footer">
          <el-button @click="drawerVisible = false">
            取消
          </el-button>
          <el-button
            type="primary"
            :loading="drawerSubmitting"
            data-testid="role-auth-submit"
            @click="submitAuthorization"
          >
            保存授权
          </el-button>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import type { RoleRow } from '@/api/security'
import {
  menuTypeLabel,
  menuTypeTagType,
  rbacStatusLabel,
  rbacStatusTagType,
  type MenuTreeNode,
} from './security-display'
import { useRoles } from './use-roles'

const {
  store,
  loadRoles,
  dialogVisible,
  dialogSubmitting,
  dialogError,
  form,
  isEditing,
  openCreate,
  openEdit,
  submitForm,
  deletingId,
  remove,
  drawerVisible,
  drawerSubmitting,
  drawerError,
  authRole,
  checkedMenuIds,
  checkedPermissionIds,
  menuTreeRef,
  menuTree,
  permissionGroups,
  syncCheckedMenus,
  openAuthorization,
  submitAuthorization,
} = useRoles()

// 模板字符串 ref（ref="menuTreeRef"）在 setup 下只写不读，显式读一次以满足 noUnusedLocals；
// 勾选收集逻辑 use-roles.ts 内部通过 menuTreeRef.value 读取树实例
void menuTreeRef

onMounted(() => {
  void loadRoles()
})
</script>

<style scoped>
.role-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.toolbar {
  margin-bottom: 12px;
}

.form-error {
  margin-top: 8px;
}

.auth-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 0 16px 16px;
}

.auth-section__title {
  margin: 0 0 10px;
  font-size: 15px;
  font-weight: 600;
}

.menu-node {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.menu-node__name {
  font-weight: 500;
}

.menu-node__meta {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.menu-node__code {
  color: var(--el-color-primary);
  font-size: 12px;
}

.permission-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;

  :deep(.el-checkbox) {
  margin-right: 0;
  height: auto;
  }
}

.permission-code {
  margin-left: 6px;
  color: var(--el-text-color-placeholder);
  font-size: 12px;
}

.empty-hint {
  margin: 0;
  color: var(--el-text-color-placeholder);
  font-size: 13px;
}

.drawer-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
