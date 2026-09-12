import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { pinia } from '@/stores'
import { useAuthStore } from '@/stores/auth'
import { usePermissionStore } from '@/stores/permission'
import { loadAdminSession } from '@/api/session'
import { bootstrapSession } from './session'

vi.mock('@/api/session', () => ({ loadAdminSession: vi.fn() }))
const router = () => createRouter({ history:createMemoryHistory(), routes:[] })

describe('session bootstrap', () => {
  beforeEach(() => { vi.clearAllMocks(); useAuthStore(pinia).clear(); usePermissionStore(pinia).clear() })
  it('STORY-001-03-01-01/TC-001 and STORY-001-03-01-02/TC-001..002 apply one atomic snapshot', async () => {
    vi.mocked(loadAdminSession).mockResolvedValue({ user:{id:'1',username:'admin',displayName:'Admin'}, menus:[], permissions:['x:read','x:read'], permissionVersion:2 })
    await Promise.all([bootstrapSession(router()), bootstrapSession(router())])
    expect(loadAdminSession).toHaveBeenCalledTimes(1)
    expect(useAuthStore(pinia).user?.displayName).toBe('Admin')
    expect(usePermissionStore(pinia).permissions).toEqual(['x:read'])
  })
  it('STORY-001-03-01-01/TC-003 and STORY-001-03-01-02/TC-003 preserve recoverability and reject invalid menus', async () => {
    const auth = useAuthStore(pinia); auth.accessToken = 'still-valid'
    vi.mocked(loadAdminSession).mockRejectedValueOnce(new Error('network'))
    await expect(bootstrapSession(router())).rejects.toThrow('network')
    expect(auth.accessToken).toBe('still-valid'); expect(auth.bootstrapState).toBe('error')
    vi.mocked(loadAdminSession).mockResolvedValueOnce({ user:{id:'1',username:'admin'}, menus:[{id:'x',name:'bad',path:'/x',componentKey:'Remote',sortOrder:0,visible:true}], permissions:['x:read'], permissionVersion:9 })
    await expect(bootstrapSession(router())).rejects.toThrow('Unsupported')
    expect(usePermissionStore(pinia).permissionVersion).toBe(0); expect(auth.user).toBeUndefined()
  })
})
