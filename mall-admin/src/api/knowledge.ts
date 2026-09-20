import http from './http'

/**
 * AI 知识库管理 API（CHG-0024 DU-FE-003）。
 *
 * 契约（requirement-design §2.1，端点属 ai-service 经网关 /api/ai/admin/**）：
 * - 成功响应为 ai-service 直出结构（非 UnifyResult 信封），故此处不做 unwrap；
 * - 错误响应为 UnifyResult 风格信封（{ success, code, message }），由视图捕获 message 提示；
 * - 五端点强制 ADMIN（网关 hasRole + ai-service parse_bearer 双保险）。
 */

/** 文档处理状态：PENDING → PROCESSING → COMPLETED / FAILED */
export type KnowledgeDocumentStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'

/** 知识库文档列表项（对齐 ai-service KnowledgeDocumentOut） */
export interface KnowledgeDocumentView {
  documentId: string
  title: string
  source: string
  storageKey: string
  enabled: boolean
  status: KnowledgeDocumentStatus
  version: number
  chunkCount: number
  createdAt: string | null
  processedAt: string | null
  failReason: string | null
}

export interface KnowledgeDocumentListResponse {
  documents: KnowledgeDocumentView[]
}

export interface KnowledgeUploadResponse {
  documentId: string
  status: KnowledgeDocumentStatus
}

export interface KnowledgeActionResponse {
  documentId: string
  status?: string
  enabled?: boolean
  deleted?: boolean
}

export const knowledgeApi = {
  /** 上传知识文档（multipart：.md/.txt ≤5MB，后端另有魔数终验） */
  async upload(file: File): Promise<KnowledgeUploadResponse> {
    const form = new FormData()
    form.append('file', file)
    const { data } = await http.post<KnowledgeUploadResponse>(
      '/api/ai/admin/knowledge/documents',
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    )
    return data
  },

  /** 文档列表（含处理状态） */
  async list(): Promise<KnowledgeDocumentView[]> {
    const { data } = await http.get<KnowledgeDocumentListResponse>(
      '/api/ai/admin/knowledge/documents',
    )
    return data.documents
  },

  /** 启用 / 停用 */
  async setEnabled(documentId: string, enabled: boolean): Promise<KnowledgeActionResponse> {
    const { data } = await http.patch<KnowledgeActionResponse>(
      `/api/ai/admin/knowledge/documents/${documentId}`,
      { enabled },
    )
    return data
  },

  /** 级联删除（MinIO + 双索引） */
  async remove(documentId: string): Promise<KnowledgeActionResponse> {
    const { data } = await http.delete<KnowledgeActionResponse>(
      `/api/ai/admin/knowledge/documents/${documentId}`,
    )
    return data
  },

  /** 重建索引（旧 chunk/embedding 失效，version+1） */
  async rebuild(documentId: string): Promise<KnowledgeActionResponse> {
    const { data } = await http.post<KnowledgeActionResponse>(
      `/api/ai/admin/knowledge/documents/${documentId}/rebuild`,
    )
    return data
  },
}
