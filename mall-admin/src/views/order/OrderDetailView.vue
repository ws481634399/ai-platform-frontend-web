<template>
  <div class="order-detail-page">
    <el-page-header
      content="订单详情"
      @back="$router.back()"
    />

    <el-card
      v-loading="loading"
      shadow="never"
      style="margin-top: 12px"
    >
      <template v-if="order">
        <el-descriptions
          :column="3"
          border
        >
          <el-descriptions-item label="订单号">
            {{ order.orderNo }}
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="statusTagType(order.status)">
              {{ statusLabel(order.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="来源">
            {{ order.source === 'BUY_NOW' ? '立即购买' : '购物车' }}
          </el-descriptions-item>
          <el-descriptions-item label="收货人">
            {{ order.receiver?.receiverName }} {{ order.receiver?.receiverPhone }}
          </el-descriptions-item>
          <el-descriptions-item
            label="收货地址"
            :span="2"
          >
            <template v-if="order.receiver">
              {{ order.receiver.province }}{{ order.receiver.city }}{{ order.receiver.district }}
              {{ order.receiver.detailAddress }}
            </template>
          </el-descriptions-item>
          <el-descriptions-item label="物流公司">
            {{ order.deliveryCompany || '—' }}
          </el-descriptions-item>
          <el-descriptions-item label="运单号">
            {{ order.trackingNo || '—' }}
          </el-descriptions-item>
          <el-descriptions-item label="取消原因">
            {{ order.cancelReason || '—' }}
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
          <el-descriptions-item label="商品总额">
            ¥{{ fenToYuan(order.goodsAmountFen) }}
          </el-descriptions-item>
          <el-descriptions-item label="运费">
            ¥{{ fenToYuan(order.freightAmountFen) }}
          </el-descriptions-item>
          <el-descriptions-item label="实付金额">
            <strong class="pay-amount">¥{{ fenToYuan(order.payAmountFen) }}</strong>
          </el-descriptions-item>
        </el-descriptions>

        <el-table
          :data="order.items"
          border
          stripe
          style="margin-top: 16px"
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
                style="width: 48px; height: 48px"
              />
            </template>
          </el-table-column>
          <el-table-column
            prop="productName"
            label="商品"
            min-width="200"
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
          />
          <el-table-column
            label="小计"
            width="120"
            align="right"
          >
            <template #default="{ row }">
              ¥{{ fenToYuan((row as OrderItemView).subtotalFen) }}
            </template>
          </el-table-column>
        </el-table>

        <div class="timeline-block">
          <h3>状态轨迹</h3>
          <el-timeline>
            <el-timeline-item
              v-for="(node, idx) in order.statusHistory"
              :key="`${node.operation}-${node.occurredAt}-${idx}`"
              :timestamp="`${formatDateTime(node.occurredAt)}${node.reason ? ' · ' + node.reason : ''}`"
            >
              {{ statusLabel(node.toStatus) }}（{{ operationLabel(node.operation) }}）
            </el-timeline-item>
          </el-timeline>
        </div>

        <div class="actions">
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
      </template>
    </el-card>

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
.pay-amount {
  color: var(--el-color-danger);
  font-size: 16px;
}

.timeline-block {
  margin-top: 20px;
}

.timeline-block h3 {
  margin: 0 0 12px;
  font-size: 15px;
}

.actions {
  margin-top: 20px;
}
</style>
