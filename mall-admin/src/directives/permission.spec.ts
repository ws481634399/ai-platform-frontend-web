import { beforeEach, describe, expect, it } from 'vitest'
import { usePermissionStore } from '@/stores/permission'
import { pinia } from '@/stores'
import { applyPermission } from './permission'

describe('permission directive', () => {
  beforeEach(() => usePermissionStore(pinia).clear())
  it('reacts to permission changes in hide and disabled modes', () => {
    const attributes: Record<string, string> = {}
    const element = { hidden: false, disabled: false, setAttribute: (key: string, value: string) => { attributes[key] = value } } as unknown as HTMLElement
    applyPermission(element, { value: 'admin:read' } as never)
    expect(element.hidden).toBe(true)
    usePermissionStore(pinia).applyBootstrap({ user:{id:'1',username:'a'}, menus:[], permissions:['admin:read'], permissionVersion:2 })
    applyPermission(element, { value: 'admin:read' } as never)
    expect(element.hidden).toBe(false)
    applyPermission(element, { value: { code:'admin:write', mode:'disabled' } } as never)
    expect((element as HTMLButtonElement).disabled).toBe(true)
    expect(attributes['aria-disabled']).toBe('true')
  })
})
