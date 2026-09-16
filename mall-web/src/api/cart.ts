import http from './http'

/**
 * 购物车 API（CHG-0018）。
 *
 * 金额一律整数分；skuId / memberId 为雪花字符串。
 * 会员端点需登录态（http 拦截器自动注入 Bearer）；公开端点无需鉴权。
 */

/** 购物车条目（后端 GET /api/mall/cart 返回） */
export interface CartItemView {
  skuId: string
  productId: string
  productName: string
  skuName: string
  specs: string
  imageUrl: string
  priceFen: number
  quantity: number
  selected: boolean
  stockStatus: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'UNKNOWN'
}

/** 购物车读模型 */
export interface CartView {
  memberId: string
  items: CartItemView[]
  totalQuantity: number
  selectedQuantity: number
  selectedTotalFen: number
}

/** 加购请求 */
export interface AddCartItemRequest {
  skuId: string
  quantity: number
}

/** 改量请求 */
export interface UpdateCartItemRequest {
  skuId: string
  quantity: number
}

/** 批量删除请求 */
export interface RemoveCartItemsRequest {
  skuIds: string[]
}

/** 勾选请求 */
export interface SetCartSelectedRequest {
  skuId: string
  selected: boolean
}

/** 全选请求 */
export interface SelectAllCartRequest {
  selected: boolean
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

/** 截断条目（超 999） */
export interface TruncatedSkuDto {
  skuId: string
  allowed: number
  incoming: number
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

/** 公开 SKU 条目（游客车展示用） */
export interface SkuItemView {
  skuId: string
  productId: string
  productName: string
  skuName: string
  specs: string
  imageUrl: string
  priceFen: number
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

  /** POST /api/mall/cart/items 加购 */
  async addItem(request: AddCartItemRequest): Promise<CartView> {
    return unwrap<CartView>(await http.post('/api/mall/cart/items', request))
  },

  /** PUT /api/mall/cart/items 改量 */
  async updateItem(request: UpdateCartItemRequest): Promise<CartView> {
    return unwrap<CartView>(await http.put('/api/mall/cart/items', request))
  },

  /** DELETE /api/mall/cart/items 批量删除 */
  async removeItems(request: RemoveCartItemsRequest): Promise<CartView> {
    return unwrap<CartView>(await http.delete('/api/mall/cart/items', { data: request }))
  },

  /** PATCH /api/mall/cart/items/selected 单条勾选 */
  async setSelected(request: SetCartSelectedRequest): Promise<CartView> {
    return unwrap<CartView>(await http.patch('/api/mall/cart/items/selected', request))
  },

  /** PATCH /api/mall/cart/select-all 全选 */
  async selectAll(request: SelectAllCartRequest): Promise<CartView> {
    return unwrap<CartView>(await http.patch('/api/mall/cart/select-all', request))
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
    return unwrap<SkuItemView[]>(await http.post('/api/mall/skus/items', request))
  },
}
