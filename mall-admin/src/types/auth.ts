export interface AdminProfile {
  id: string
  username: string
  displayName?: string
}

export interface AdminMenu {
  id: string
  parentId?: string
  name: string
  type?: 'DIRECTORY' | 'PAGE' | 'ACTION'
  path: string
  componentKey: string
  permissionCode?: string
  sortOrder: number
  visible: boolean
  children?: AdminMenu[]
}

export interface LoginRequest { username: string; password: string }
export interface TokenPair { accessToken: string; accessExpiresAt: string; refreshExpiresAt: string }
export interface BootstrapResponse {
  user: AdminProfile
  menus: AdminMenu[]
  permissions: string[]
  permissionVersion: number
}
