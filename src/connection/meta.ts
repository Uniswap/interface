import { ConnectionType, toConnectionType } from './types'

export interface ConnectionMeta {
  type: ConnectionType
  address?: string
  ENSName?: string
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
