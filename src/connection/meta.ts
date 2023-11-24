import { ConnectionType, RecentConnectionMeta } from './types'

export const connectionMetaKey = 'connection_meta'

export function getPersistedConnectionMeta(): RecentConnectionMeta | undefined {
  const value = localStorage.getItem(connectionMetaKey)
  if (!value) return

  try {
    const parsedMeta = JSON.parse(value) as RecentConnectionMeta
    if (ConnectionType[parsedMeta.type]) return parsedMeta
  } catch (e) {
    console.warn(e)
  }
  return
}

export function setPersistedConnectionMeta(meta: RecentConnectionMeta | undefined) {
  if (!meta) return localStorage.removeItem(connectionMetaKey)

  localStorage.setItem(connectionMetaKey, JSON.stringify(meta))
}
