import { describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { registerDynamicRoutes, removeDynamicRoutes } from './dynamic-routes'

describe('dynamic routes', () => {
  const router = () => createRouter({ history: createMemoryHistory(), routes: [] })
  it('registers only compiled components', () => {
    const instance = router()
    registerDynamicRoutes(instance, [{ id:'1', name:'工作台', path:'/dashboard', componentKey:'Workbench', sortOrder:0, visible:true }])
    expect(instance.hasRoute('menu-1')).toBe(true)
  })
  it('rejects external path and unknown component', () => {
    expect(() => registerDynamicRoutes(router(), [{ id:'1', name:'bad', path:'//evil', componentKey:'Workbench', sortOrder:0, visible:true }])).toThrow('Unsafe')
    expect(() => registerDynamicRoutes(router(), [{ id:'2', name:'bad', path:'/bad', componentKey:'Remote', sortOrder:0, visible:true }])).toThrow('Unsupported')
  })
  it('registers directory children once and clear removes only dynamic routes', () => {
    const instance = router()
    const menus = [{ id:'d', name:'目录', type:'DIRECTORY' as const, path:'', componentKey:'', sortOrder:0, visible:true,
      children:[{ id:'p', name:'页面', type:'PAGE' as const, path:'/page', componentKey:'Workbench', sortOrder:0, visible:true }] }]
    registerDynamicRoutes(instance, menus); registerDynamicRoutes(instance, menus)
    expect(instance.hasRoute('menu-d')).toBe(false); expect(instance.hasRoute('menu-p')).toBe(true)
    removeDynamicRoutes(); expect(instance.hasRoute('menu-p')).toBe(false)
  })
})
