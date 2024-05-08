import { ConnectionType, RecentConnectionMeta } from './types'

export const connectionMetaKey = 'connection_meta'

function isRecentConnectionMeta(value: any): value is RecentConnectionMeta {
  const test: RecentConnectionMeta = { type: value.type } // reconstruct literal to ensure all required fields are present
  return Boolean(test.type && ConnectionType[test.type])
}

export function getRecentConnectionMeta(): RecentConnectionMeta | undefined {
  const value = localStorage.getItem(connectionMetaKey)
  if (!value) return

  try {
    const json = JSON.parse(value)
    if (isRecentConnectionMeta(json)) return json
  } catch (e) {
    console.warn(e)
  }
  // If meta is invalid or there is an error, clear it from local storage.
  setRecentConnectionMeta(undefined)
  return
}

export function setRecentConnectionMeta(meta: RecentConnectionMeta | undefined) {
  if (!meta) return localStorage.removeItem(connectionMetaKey)

  localStorage.setItem(connectionMetaKey, JSON.stringify(meta))
}
