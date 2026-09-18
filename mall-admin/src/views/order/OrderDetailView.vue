<template>
  <div class="admin-page order-detail-page">
    <PageHeader inline />

    <!-- 订单信息 + 物流 -->
    <el-card
      v-loading="loading"
      shadow="never"
      class="order-detail-page__card"
    >
      <template v-if="order">
        <div class="order-detail-page__heading">
          <div class="order-detail-page__title">
            <span class="order-detail-page__order-no tabular">{{ order.orderNo }}</span>
            <el-tag
              :type="statusTagType(order.status)"
              size="default"
            >
              {{ statusLabel(order.status) }}
            </el-tag>
          </div>
          <div class="order-detail-page__actions">
            <el-button
              v-if="has('order:ship') && order.status === 'PAID'"
              type="primary"
              data-testid="ship-open-btn"
              @click="shipVisible = true"
            >
              发货
            </el-button>
            <el-tag
              v-else-if="order.status === 'SHIPPED' || order.status === 'COMPLETED'"
              type="success"
            >
              已发货
            </el-tag>
          </div>
        </div>

        <el-descriptions
          :column="3"
          border
          class="order-detail-page__descriptions"
        >
          <el-descriptions-item label="来源">
            {{ order.source === 'BUY_NOW' ? '立即购买' : '购物车' }}
          </el-descriptions-item>
          <el-descriptions-item label="下单时间">
            {{ formatDateTime(order.createdAt) }}
          </el-descriptions-item>
          <el-descriptions-item label="支付时间">
            {{ formatDateTime(order.paidAt) }}
          </el-descriptions-item>
          <el-descriptions-item label="发货时间">
            {{ formatDateTime(order.shippedAt) }}
          </el-descriptions-item>
          <el-descriptions-item label="完成时间">
            {{ formatDateTime(order.completedAt) }}
          </el-descriptions-item>
          <el-descriptions-item label="取消时间">
            {{ formatDateTime(order.cancelledAt) }}
          </el-descriptions-item>
          <el-descriptions-item label="取消原因">
            {{ order.cancelReason || '—' }}
          </el-descriptions-item>
          <el-descriptions-item label="物流公司">
            {{ order.deliveryCompany || '—' }}
          </el-descriptions-item>
          <el-descriptions-item label="运单号">
            <span
              v-if="order.trackingNo"
              class="tabular"
            >{{ order.trackingNo }}</span>
            <span v-else>—</span>
          </el-descriptions-item>
        </el-descriptions>
      </template>
      <div
        v-else-if="!loading"
        class="order-detail-page__empty"
      >
        未找到订单
      </div>
    </el-card>

    <template v-if="order">
      <!-- 收货信息 -->
      <el-card
        v-if="order.receiver"
        shadow="never"
        class="order-detail-page__card"
      >
        <div class="order-detail-page__section-title">
          收货信息
        </div>
        <el-descriptions
          :column="2"
          border
        >
          <el-descriptions-item label="收货人">
            {{ order.receiver.receiverName }}
          </el-descriptions-item>
          <el-descriptions-item label="联系电话">
            <span class="tabular">{{ order.receiver.receiverPhone }}</span>
          </el-descriptions-item>
          <el-descriptions-item
            label="收货地址"
            :span="2"
          >
            {{ order.receiver.province }}{{ order.receiver.city }}{{ order.receiver.district }}
            {{ order.receiver.detailAddress }}
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- 商品明细 -->
      <el-card
        shadow="never"
        class="order-detail-page__card"
        body-style="padding: 0"
      >
        <div class="order-detail-page__section-title order-detail-page__section-title--inset">
          商品明细
        </div>
        <el-table
          :data="order.items"
          stripe
          class="order-detail-page__table"
        >
          <el-table-column
            label="图片"
            width="80"
          >
            <template #default="{ row }">
              <el-image
                v-if="(row as OrderItemView).mainImageUrl"
                :src="(row as OrderItemView).mainImageUrl!"
                fit="cover"
                class="order-detail-page__thumb"
              />
              <span
                v-else
                class="order-detail-page__thumb-empty"
              >—</span>
            </template>
          </el-table-column>
          <el-table-column
            prop="productName"
            label="商品"
            min-width="200"
            show-overflow-tooltip
          />
          <el-table-column
            label="规格 / SKU"
            min-width="160"
          >
            <template #default="{ row }">
              {{ specText((row as OrderItemView).specifications) }}
              {{ (row as OrderItemView).skuCode ? ` / ${(row as OrderItemView).skuCode}` : '' }}
            </template>
          </el-table-column>
          <el-table-column
            label="单价"
            width="120"
            align="right"
            class-name="tabular"
          >
            <template #default="{ row }">
              ¥{{ fenToYuan((row as OrderItemView).unitPriceFen) }}
            </template>
          </el-table-column>
          <el-table-column
            prop="quantity"
            label="数量"
            width="80"
            align="right"
            class-name="tabular"
          />
          <el-table-column
            label="小计"
            width="120"
            align="right"
            class-name="tabular"
          >
            <template #default="{ row }">
              ¥{{ fenToYuan((row as OrderItemView).subtotalFen) }}
            </template>
          </el-table-column>
        </el-table>

        <!-- 金额合计 -->
        <div class="order-detail-page__amount">
          <div class="order-detail-page__amount-row">
            <span class="order-detail-page__amount-label">商品总额</span>
            <span class="tabular">¥{{ fenToYuan(order.goodsAmountFen) }}</span>
          </div>
          <div class="order-detail-page__amount-row">
            <span class="order-detail-page__amount-label">运费</span>
            <span class="tabular">¥{{ fenToYuan(order.freightAmountFen) }}</span>
          </div>
          <div class="order-detail-page__amount-row order-detail-page__amount-row--accent">
            <span class="order-detail-page__amount-label">实付金额</span>
            <span class="tabular order-detail-page__pay-amount">¥{{ fenToYuan(order.payAmountFen) }}</span>
          </div>
        </div>
      </el-card>

      <!-- 状态轨迹 -->
      <el-card
        v-if="order.statusHistory?.length"
        shadow="never"
        class="order-detail-page__card"
      >
        <div class="order-detail-page__section-title">
          状态轨迹
        </div>
        <el-timeline class="order-detail-page__timeline">
          <el-timeline-item
            v-for="(node, idx) in order.statusHistory"
            :key="`${node.operation}-${node.occurredAt}-${idx}`"
            :timestamp="`${formatDateTime(node.occurredAt)}${node.reason ? ' · ' + node.reason : ''}`"
          >
            {{ statusLabel(node.toStatus) }}（{{ operationLabel(node.operation) }}）
          </el-timeline-item>
        </el-timeline>
      </el-card>
    </template>

    <el-dialog
      v-model="shipVisible"
      title="订单发货"
      width="460px"
      @closed="resetShipForm"
    >
      <el-form
        ref="shipFormRef"
        :model="shipForm"
        :rules="shipRules"
        label-width="90px"
        @submit.prevent
      >
        <el-form-item
          label="物流公司"
          prop="deliveryCompany"
        >
          <el-input
            v-model="shipForm.deliveryCompany"
            placeholder="如：顺丰速运"
            maxlength="64"
          />
        </el-form-item>
        <el-form-item
          label="运单号"
          prop="trackingNo"
        >
          <el-input
            v-model="shipForm.trackingNo"
            placeholder="物流运单号"
            maxlength="64"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="shipVisible = false">
          取消
        </el-button>
        <el-button
          type="primary"
          :loading="submitting"
          data-testid="ship-submit-btn"
          @click="submitShip"
        >
          确认发货
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { orderApi, type OrderItemView, type OrderView } from '@/api/order/order'
import { usePermission } from '@/composables/usePermission'
import PageHeader from '@/components/PageHeader.vue'
import { fenToYuan, formatDateTime, operationLabel, statusLabel, statusTagType } from './order-display'

const route = useRoute()
const { has } = usePermission()

const loading = ref(false)
const order = ref<OrderView | null>(null)
const shipVisible = ref(false)
const submitting = ref(false)
const shipFormRef = ref<FormInstance>()
const shipForm = reactive<{ deliveryCompany: string; trackingNo: string }>({
  deliveryCompany: '',
  trackingNo: '',
})
const shipRules: FormRules = {
  deliveryCompany: [{ required: true, message: '请填写物流公司', trigger: 'blur' }],
  trackingNo: [{ required: true, message: '请填写运单号', trigger: 'blur' }],
}

function specText(specs: Record<string, string>): string {
  return Object.values(specs ?? {}).join(' / ')
}

async function load(): Promise<void> {
  const orderNo = route.params.orderNo as string
  loading.value = true
  try {
    order.value = await orderApi.detail(orderNo)
  } catch {
    // 错误文案由拦截器统一提示
  } finally {
    loading.value = false
  }
}

function resetShipForm(): void {
  shipForm.deliveryCompany = ''
  shipForm.trackingNo = ''
  shipFormRef.value?.clearValidate()
}

async function submitShip(): Promise<void> {
  if (!shipFormRef.value || !order.value) return
  const valid = await shipFormRef.value.validate().catch(() => false)
  if (!valid) return
  submitting.value = true
  try {
    order.value = await orderApi.ship(order.value.orderNo, {
      deliveryCompany: shipForm.deliveryCompany.trim(),
      trackingNo: shipForm.trackingNo.trim(),
    })
    ElMessage.success('发货成功')
    shipVisible.value = false
  } catch {
    // 服务端错误由拦截器提示
  } finally {
    submitting.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.order-detail-page__card {
  border-radius: var(--admin-radius-lg);
}

.order-detail-page__heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--admin-space-3);
  margin-bottom: var(--admin-space-4);
}

.order-detail-page__title {
  display: flex;
  align-items: center;
  gap: var(--admin-space-3);
  min-width: 0;
}

.order-detail-page__order-no {
  font-size: 16px;
  font-weight: 600;
  color: var(--admin-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.order-detail-page__actions {
  flex-shrink: 0;
}

.order-detail-page__descriptions {
  margin-top: 0;
}

.order-detail-page__section-title {
  margin: 0 0 var(--admin-space-3);
  font-size: 14px;
  font-weight: 600;
  color: var(--admin-text);
}

.order-detail-page__section-title--inset {
  padding: var(--admin-space-3) var(--admin-space-4) 0;
}

.order-detail-page__table {
  width: 100%;
}

.order-detail-page__thumb {
  width: 48px;
  height: 48px;
  border-radius: var(--admin-radius-sm);
  border: 1px solid var(--admin-border-light);
}

.order-detail-page__thumb-empty {
  color: var(--admin-text-placeholder);
}

.order-detail-page__amount {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--admin-space-2);
  padding: var(--admin-space-4);
  border-top: 1px solid var(--admin-border-light);
  background: var(--admin-bg-panel);
}

.order-detail-page__amount-row {
  display: flex;
  align-items: baseline;
  justify-content: flex-end;
  gap: var(--admin-space-4);
  font-size: 13px;
  color: var(--admin-text-secondary);
}

.order-detail-page__amount-label {
  min-width: 64px;
  text-align: right;
}

.order-detail-page__amount-row--accent {
  font-size: 15px;
  color: var(--admin-text);
}

.order-detail-page__pay-amount {
  color: var(--admin-danger);
  font-weight: 600;
}

.order-detail-page__timeline {
  margin-top: var(--admin-space-2);
  padding-left: var(--admin-space-1);
}

.order-detail-page__empty {
  padding: var(--admin-space-6);
  color: var(--admin-text-tertiary);
  font-size: 13px;
  text-align: center;
}

@media (max-width: 768px) {
  .order-detail-page__heading {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--admin-space-2);
  }

  .order-detail-page__actions {
    width: 100%;
  }
}
</style>
