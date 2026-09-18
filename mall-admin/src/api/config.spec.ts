import { describe, expect, it, vi, beforeEach } from 'vitest'
import { AxiosError } from 'axios'
import {
  configHistoryApi,
  extractApiErrorMessage,
  featureConfigApi,
  friendlyConfigErrorMessage,
  getApiErrorCode,
  systemParameterApi,
} from './config'

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
}))

vi.mock('./http', () => ({
  default: {
    get: mocks.get,
    post: mocks.post,
    put: mocks.put,
    delete: mocks.delete,
  },
}))

function ok<T>(data: T): { data: { code: string; data: T } } {
  return { data: { code: '0', data } }
}

/** 构造带 UnifyResult 响应体的 axios 错误（对齐 http 拦截器透传形态） */
function apiError(status: number, code: string, message: string): AxiosError {
  return new AxiosError(
    message,
    String(status),
    undefined,
    undefined,
    { status, statusText: 'Error', headers: {}, config: {} as never, data: { code, message } },
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('featureConfigApi', () => {
  it('page 携带筛选与分页参数，空筛选归一化为 undefined', async () => {
    const payload = {
      total: 1,
      page: 1,
      size: 20,
      items: [{ key: 'f', name: '开关', group: 'g', enabled: true, publicFlag: false, builtIn: true, version: 0, description: '' }],
    }
    mocks.get.mockResolvedValueOnce(ok(payload))

    const result = await featureConfigApi.page({ group: '', enabled: '', page: 1, size: 20 })

    expect(mocks.get).toHaveBeenCalledWith('/api/admin/feature-configs', {
      params: { group: undefined, enabled: undefined, page: 1, size: 20 },
    })
    expect(result.items).toHaveLength(1)
    expect(result.items[0].key).toBe('f')
  })

  it('page 透传 enabled 布尔与去空白后的 group', async () => {
    mocks.get.mockResolvedValueOnce(ok({ total: 0, page: 1, size: 10, items: [] }))

    await featureConfigApi.page({ group: '  trade  ', enabled: false, page: 3, size: 10 })

    expect(mocks.get).toHaveBeenCalledWith('/api/admin/feature-configs', {
      params: { group: 'trade', enabled: false, page: 3, size: 10 },
    })
  })

  it('create/update/delete 走对应端点，删除原因走 query，更新携带 version 与变更原因', async () => {
    mocks.post.mockResolvedValueOnce(ok({ key: 'a' }))
    mocks.put.mockResolvedValueOnce(ok({ key: 'a' }))
    mocks.delete.mockResolvedValueOnce(ok(null))

    await featureConfigApi.create({
      key: 'a',
      name: 'A',
      group: 'g',
      enabled: true,
      publicFlag: false,
      description: '',
    })
    expect(mocks.post).toHaveBeenCalledWith('/api/admin/feature-configs', {
      key: 'a', name: 'A', group: 'g', enabled: true, publicFlag: false, description: '',
    })

    await featureConfigApi.update('a', {
      name: 'A2', group: 'g', enabled: false, publicFlag: true, description: 'd', version: 7, changeReason: '关闭验证',
    })
    expect(mocks.put).toHaveBeenCalledWith('/api/admin/feature-configs/a', {
      name: 'A2', group: 'g', enabled: false, publicFlag: true, description: 'd', version: 7, changeReason: '关闭验证',
    })

    await featureConfigApi.remove('a', '过期清理')
    expect(mocks.delete).toHaveBeenCalledWith('/api/admin/feature-configs/a', {
      params: { reason: '过期清理' },
    })
  })

  it('key 含特殊字符时走 encodeURIComponent', async () => {
    mocks.put.mockResolvedValueOnce(ok(null))
    await featureConfigApi.update('a/b', {
      name: 'n', group: '', enabled: true, publicFlag: false, description: '', version: 1, changeReason: 'r',
    })
    expect(mocks.put).toHaveBeenCalledWith('/api/admin/feature-configs/a%2Fb', expect.anything())
  })
})

describe('systemParameterApi', () => {
  it('page 与 create 序列化参数（数值边界以字符串下发）', async () => {
    mocks.get.mockResolvedValueOnce(ok({ total: 0, page: 1, size: 20, items: [] }))
    await systemParameterApi.page({ group: 'trade', page: 1, size: 20 })
    expect(mocks.get).toHaveBeenCalledWith('/api/admin/system-parameters', {
      params: { group: 'trade', enabled: undefined, page: 1, size: 20 },
    })

    mocks.post.mockResolvedValueOnce(ok({ key: 'timeout' }))
    await systemParameterApi.create({
      key: 'timeout',
      name: '超时',
      group: 'trade',
      type: 'INTEGER',
      value: '30',
      defaultValue: '60',
      minValue: '1',
      maxValue: '300',
      effectType: 'DYNAMIC',
      publicFlag: false,
      description: '',
    })
    expect(mocks.post).toHaveBeenCalledWith('/api/admin/system-parameters', expect.objectContaining({
      key: 'timeout',
      type: 'INTEGER',
      value: '30',
      minValue: '1',
      maxValue: '300',
      effectType: 'DYNAMIC',
    }))
  })

  it('update 携带乐观锁 version 与 changeReason；delete 不带 query', async () => {
    mocks.put.mockResolvedValueOnce(ok(null))
    mocks.delete.mockResolvedValueOnce(ok(null))

    await systemParameterApi.update('timeout', {
      name: '超时', group: 'trade', value: '45', effectType: 'RESTART_REQUIRED',
      publicFlag: false, description: '', version: 3, changeReason: '调大阈值',
    })
    expect(mocks.put).toHaveBeenCalledWith('/api/admin/system-parameters/timeout', expect.objectContaining({
      value: '45',
      version: 3,
      changeReason: '调大阈值',
    }))

    await systemParameterApi.remove('timeout')
    expect(mocks.delete).toHaveBeenCalledWith('/api/admin/system-parameters/timeout')
  })
})

describe('configHistoryApi', () => {
  it('page 透传 configType / key / 分页并解包 items', async () => {
    const payload = {
      total: 1,
      page: 1,
      size: 10,
      items: [{
        configType: 'FEATURE',
        configKey: 'a',
        oldValue: null,
        newValue: '{"enabled":true}',
        changeKind: 'CREATED',
        changedBy: 'admin',
        changeReason: null,
        traceId: 't-1',
        changedAt: 1758000000000,
      }],
    }
    mocks.get.mockResolvedValueOnce(ok(payload))

    const result = await configHistoryApi.page({ configType: 'FEATURE', key: 'a', page: 1, size: 10 })

    expect(mocks.get).toHaveBeenCalledWith('/api/admin/config-history', {
      params: { configType: 'FEATURE', key: 'a', page: 1, size: 10 },
    })
    expect(result.items[0].changedAt).toBe(1758000000000)
  })
})

describe('配置域错误归一化', () => {
  it('优先取 UnifyResult.message（B0602 key 冲突等）', () => {
    const ex = apiError(409, 'B0602', '配置 Key 已存在')
    expect(extractApiErrorMessage(ex, '保存失败')).toBe('配置 Key 已存在')
    expect(getApiErrorCode(ex)).toBe('B0602')
  })

  it('B0604 版本冲突追加刷新重试引导', () => {
    const ex = apiError(409, 'B0604', '配置版本已变化')
    expect(friendlyConfigErrorMessage(ex, '保存失败')).toBe('配置版本已变化，请刷新后重试')
  })

  it('服务端文案已含「刷新」时不重复追加', () => {
    const ex = apiError(409, 'B0604', '版本冲突，请刷新后重试')
    expect(friendlyConfigErrorMessage(ex, '保存失败')).toBe('版本冲突，请刷新后重试')
  })

  it('无响应体的 axios 错误回退 axios.message，再回退兜底文案', () => {
    const networkError = new AxiosError('Network Error')
    expect(extractApiErrorMessage(networkError, '加载失败')).toBe('Network Error')
    expect(getApiErrorCode(networkError)).toBeNull()
    expect(extractApiErrorMessage('UNKNOWN', '加载失败')).toBe('加载失败')
  })

  it('403 统一无权提示兜底', () => {
    const ex = apiError(403, 'A0403', '')
    expect(friendlyConfigErrorMessage(ex, '加载失败')).toBe('无权执行该操作（403）')
  })
})
