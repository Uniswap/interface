import { ConnectionType } from './types'

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
      return JSON.parse(value) as ConnectionMeta
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
