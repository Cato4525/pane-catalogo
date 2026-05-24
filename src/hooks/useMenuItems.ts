import { useMemo } from 'react'
import { usePermissions } from './usePermissions'
import { menuConfig, adminToolsConfig } from '../config/menuConfig'

export function useMenuItems() {
  const { isAdmin, hasPermission } = usePermissions()

  const menuItems = useMemo(() => {
    return menuConfig.filter(item => {
      if (isAdmin) return true
      if (!item.permission) return true
      return hasPermission(item.permission)
    })
  }, [isAdmin, hasPermission])

  const toolsItems = useMemo(() => {
    return adminToolsConfig.filter(item => {
      if (isAdmin) return true
      if (!item.permission) return true
      return hasPermission(item.permission)
    })
  }, [isAdmin, hasPermission])

  return { menuItems, toolsItems }
}
