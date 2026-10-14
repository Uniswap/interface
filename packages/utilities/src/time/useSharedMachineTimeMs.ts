import { useCallback, useSyncExternalStore } from 'react'

interface SharedTicker {
  now: number
  intervalId: ReturnType<typeof setInterval> | undefined
  listeners: Set<() => void>
}

const sharedTickers = new Map<number, SharedTicker>()

function getSharedTicker(updateInterval: number): SharedTicker {
  let ticker = sharedTickers.get(updateInterval)
  if (!ticker) {
    ticker = { now: Date.now(), intervalId: undefined, listeners: new Set() }
    sharedTickers.set(updateInterval, ticker)
  }
  return ticker
}

/**
 * Wall clock re-rendering subscribers every `updateInterval`. Subscribers with the same interval share
 * one ticker so sibling countdowns don't drift out of phase.
 */
export function useSharedMachineTimeMs(updateInterval: number): number {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const ticker = getSharedTicker(updateInterval)
      ticker.listeners.add(onStoreChange)
      if (ticker.intervalId === undefined) {
        ticker.now = Date.now()
        ticker.intervalId = setInterval(() => {
          ticker.now = Date.now()
          ticker.listeners.forEach((listener) => listener())
        }, updateInterval)
      }
      return () => {
        ticker.listeners.delete(onStoreChange)
        if (ticker.listeners.size === 0 && ticker.intervalId !== undefined) {
          clearInterval(ticker.intervalId)
          ticker.intervalId = undefined
        }
      }
    },
    [updateInterval],
  )
  const getSnapshot = useCallback(() => getSharedTicker(updateInterval).now, [updateInterval])

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}
