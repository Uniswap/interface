import { ConnectionType, toConnectionType } from './types'

export interface ConnectionMeta {
  type: ConnectionType
  display?: string
  displayType?: ConnectionDisplayType
}

export enum ConnectionDisplayType {
  Address = 'Address',
  ENSName = 'ENSName',
}

const connectionMetaKey = 'connection_meta'

export function getConnectionMeta(): ConnectionMeta | undefined {
  try {
    const value = localStorage.getItem(connectionMetaKey)
    if (value) {
      const raw = JSON.parse(value) as ConnectionMeta
      const connectionType = toConnectionType(raw.type)
      if (connectionType) {
        return {
          type: connectionType,
          display: raw.display,
          displayType: raw.displayType,
        }
      }
    }
  } catch (e) {
    console.warn(e)
  }
  return
}

export function setConnectionMeta(meta: ConnectionMeta) {
  localStorage.setItem(connectionMetaKey, JSON.stringify(meta))
}

export function deleteConnectionMeta() {
  localStorage.removeItem(connectionMetaKey)
}
