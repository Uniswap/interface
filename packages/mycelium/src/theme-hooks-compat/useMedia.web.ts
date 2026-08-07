/**
 * Web leg of the `useMedia` compat (Tamagui's `useMedia` via `ui/src`): the
 * same breakpoint booleans, evaluated with `window.matchMedia` against the
 * max-width/max-height queries `ui/src/theme/media.ts` declares.
 */
import { useSyncExternalStore } from 'react'
import { BREAKPOINT_PX, HEIGHT_BREAKPOINT_PX, type MediaQueryKey } from './tokens'
import type { MediaState } from './useMedia'

const MEDIA_QUERIES: ReadonlyArray<[MediaQueryKey, string]> = [
  ...Object.entries(BREAKPOINT_PX).map(([key, px]): [MediaQueryKey, string] => [
    key as MediaQueryKey,
    `(max-width: ${px}px)`,
  ]),
  ...Object.entries(HEIGHT_BREAKPOINT_PX).map(([key, px]): [MediaQueryKey, string] => [
    key as MediaQueryKey,
    `(max-height: ${px}px)`,
  ]),
]

const SERVER_MEDIA_STATE: MediaState = Object.fromEntries(MEDIA_QUERIES.map(([key]) => [key, false])) as Record<
  MediaQueryKey,
  boolean
>

interface MediaQuerySubscription {
  key: MediaQueryKey
  queryList: MediaQueryList
}

const subscribers = new Set<() => void>()
let queryLists: MediaQuerySubscription[] | undefined
let snapshot: MediaState | undefined

function computeState(lists: MediaQuerySubscription[]): MediaState {
  return Object.fromEntries(lists.map(({ key, queryList }) => [key, queryList.matches])) as Record<
    MediaQueryKey,
    boolean
  >
}

function invalidate(): void {
  const lists = queryLists
  if (lists === undefined) {
    return
  }
  const next = computeState(lists)
  const previous = snapshot
  if (previous === undefined || MEDIA_QUERIES.some(([key]) => next[key] !== previous[key])) {
    snapshot = next
  }
  for (const notify of subscribers) {
    notify()
  }
}

function ensureQueryLists(): MediaQuerySubscription[] {
  if (queryLists === undefined) {
    queryLists = MEDIA_QUERIES.map(([key, query]) => {
      const queryList = window.matchMedia(query)
      // Legacy addListener fallback matches Tamagui's subscription (Safari < 14).
      if (typeof queryList.addEventListener === 'function') {
        queryList.addEventListener('change', invalidate)
      } else {
        queryList.addListener(invalidate)
      }
      return { key, queryList }
    })
  }
  return queryLists
}

function subscribeToMedia(onChange: () => void): () => void {
  ensureQueryLists()
  subscribers.add(onChange)
  return () => {
    subscribers.delete(onChange)
  }
}

function getMediaSnapshot(): MediaState {
  const lists = ensureQueryLists()
  snapshot ??= computeState(lists)
  return snapshot
}

function getServerMediaSnapshot(): MediaState {
  return SERVER_MEDIA_STATE
}

export function useMedia(): MediaState {
  return useSyncExternalStore(subscribeToMedia, getMediaSnapshot, getServerMediaSnapshot)
}
