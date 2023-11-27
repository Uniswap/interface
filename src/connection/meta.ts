import { ConnectionType, toConnectionType } from './types'

export interface ConnectionMeta {
  type: ConnectionType
  address?: string
  ENSName?: string
  latestEip6963rdns?: string
}

export const connectionMetaKey = 'connection_meta'

export function getPersistedConnectionMeta(): ConnectionMeta | undefined {
  try {
    const value = localStorage.getItem(connectionMetaKey)
    if (value) {
      const raw = JSON.parse(value) as ConnectionMeta
      const connectionType = toConnectionType(raw.type)
      if (connectionType) {
        return {
          type: connectionType,
          address: raw.address,
          ENSName: raw.ENSName,
        }
      }
    }
  } catch (e) {
    console.warn(e)
  }
  return
}

export function setPersistedConnectionMeta(meta: ConnectionMeta) {
  localStorage.setItem(connectionMetaKey, JSON.stringify(meta))
}

export function deletePersistedConnectionMeta() {
  localStorage.removeItem(connectionMetaKey)
}

const recentlyUsedInjectorKey = 'recently_used_injector'
export function getRecentlyUsedInjector(): string | null {
  try {
    const value = localStorage.getItem(recentlyUsedInjectorKey)
    return value ?? null
  } catch (e) {
    console.warn(e)
  }
  return null
}

export function setRecentlyUsedInjector(rdns?: string) {
  if (rdns) localStorage.setItem(recentlyUsedInjectorKey, rdns)
}
