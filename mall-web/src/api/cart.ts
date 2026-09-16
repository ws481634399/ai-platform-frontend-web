import http from './http'

/**
 * 购物车 API（CHG-0018）。
 *
 * 金额一律整数分；skuId / memberId 为雪花字符串。
 * 会员端点需登录态（http 拦截器自动注入 Bearer）；公开端点无需鉴权。
 */

/** 购物车条目（后端 GET /api/mall/cart 返回，契约对齐 CartLineView） */
export interface CartItemView {
  skuId: string
  productId: string | null
  productName: string | null
  /** 后端以 skuCode 承载行内 SKU 标识 */
  skuName: string | null
  /** 规格名值对（与后端 Map<String,String> 对齐） */
  specs: Record<string, string>
  imageUrl: string | null
  priceFen: number | null
  quantity: number
  selected: boolean
  stockStatus: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'UNKNOWN'
}

/** 购物车读模型（后端 CartReadView：items + 汇总计数） */
export interface CartView {
  items: CartItemView[]
  selectedTotalFen: number
  selectedCount: number
}

/** 加购请求 */
export interface AddCartItemRequest {
  skuId: string
  quantity: number
}

/** 改量请求（PUT /api/mall/cart/items/{skuId} 请求体） */
export interface UpdateCartItemRequest {
  quantity: number
}

/** 批量删除请求（POST /api/mall/cart/items/batch-delete） */
export interface RemoveCartItemsRequest {
  skuIds: string[]
}

/** 游客车条目（合并入参） */
export interface GuestCartItemDto {
  skuId: string
  quantity: number
}

/** 合并购物车请求 */
export interface MergeCartRequest {
  mergeToken: string
  items: GuestCartItemDto[]
}

/** 合并结果中的条目 */
export interface MergedSkuDto {
  skuId: string
  quantity: number
}

/** 截断条目（超单 SKU 999 上限，finalQuantity 为截断后保留数量） */
export interface TruncatedSkuDto {
  skuId: string
  finalQuantity: number
}

/** 丢弃条目（不可售 / 超 100） */
export interface DroppedSkuDto {
  skuId: string
  reason: string
}

/** 合并购物车响应 */
export interface MergeCartResponse {
  merged: MergedSkuDto[]
  truncated: TruncatedSkuDto[]
  dropped: DroppedSkuDto[]
}

/** 合并 token 响应 */
export interface MergeTokenResponse {
  mergeToken: string
}

/** 公开 SKU 条目（游客车展示用，前端展示模型） */
export interface SkuItemView {
  skuId: string
  productId: string
  productName: string
  /** 后端无独立 SKU 名称，以 skuCode 承载 */
  skuName: string
  /** 规格名值对 */
  specs: Record<string, string>
  imageUrl: string
  priceFen: number
}

/** POST /api/mall/skus/items 后端原始视图（SkuItemView 后端 DTO） */
interface SkuItemRaw {
  productId: string
  productName: string
  skuId: string
  skuCode: string | null
  salePriceInCents: number | null
  mainImageUrl: string | null
  specifications: Record<string, string> | null
}

/** 后端快照 DTO → 前端展示模型（字段名对齐会员车 CartLineView） */
function toSkuItemView(raw: SkuItemRaw): SkuItemView {
  return {
    skuId: raw.skuId,
    productId: raw.productId,
    productName: raw.productName,
    skuName: raw.skuCode ?? '',
    specs: raw.specifications ?? {},
    imageUrl: raw.mainImageUrl ?? '',
    priceFen: raw.salePriceInCents ?? 0,
  }
}

/** 公开 SKU 批量查询请求 */
export interface SkuItemsRequest {
  skuIds: string[]
}

function unwrap<T>(response: { data: { data: T } }): T {
  return response.data.data
}

export const cartApi = {
  /** GET /api/mall/cart 获取会员购物车 */
  async getCart(): Promise<CartView> {
    return unwrap<CartView>(await http.get('/api/mall/cart'))
  },

  /** POST /api/mall/cart/items 加购（返回写模型，展示请重新 GET 读模型） */
  async addItem(request: AddCartItemRequest): Promise<void> {
    await http.post('/api/mall/cart/items', request)
  },

  /** PUT /api/mall/cart/items/{skuId} 改量 */
  async updateItem(skuId: string, request: UpdateCartItemRequest): Promise<void> {
    await http.put(`/api/mall/cart/items/${encodeURIComponent(skuId)}`, request)
  },

  /** POST /api/mall/cart/items/batch-delete 批量删除 */
  async removeItems(request: RemoveCartItemsRequest): Promise<void> {
    await http.post('/api/mall/cart/items/batch-delete', request)
  },

  /** POST /api/mall/cart/items/{skuId}/select|unselect 单条勾选 */
  async setSelected(skuId: string, selected: boolean): Promise<void> {
    const action = selected ? 'select' : 'unselect'
    await http.post(`/api/mall/cart/items/${encodeURIComponent(skuId)}/${action}`)
  },

  /** POST /api/mall/cart/select-all|unselect-all 全选 */
  async selectAll(selected: boolean): Promise<void> {
    const action = selected ? 'select-all' : 'unselect-all'
    await http.post(`/api/mall/cart/${action}`)
  },

  /** POST /api/mall/cart/merge-token 申请合并 token（需登录） */
  async issueMergeToken(): Promise<MergeTokenResponse> {
    return unwrap<MergeTokenResponse>(await http.post('/api/mall/cart/merge-token'))
  },

  /** POST /api/mall/cart/merge 合并游客车到会员车（需登录） */
  async merge(request: MergeCartRequest): Promise<MergeCartResponse> {
    return unwrap<MergeCartResponse>(await http.post('/api/mall/cart/merge', request))
  },

  /** POST /api/mall/skus/items 公开 SKU 条目批量查询（游客车展示） */
  async getSkuItems(request: SkuItemsRequest): Promise<SkuItemView[]> {
    if (!request.skuIds.length) return []
    const raw = await unwrap<SkuItemRaw[]>(await http.post('/api/mall/skus/items', request))
    return raw.map(toSkuItemView)
  },
}
