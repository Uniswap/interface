import { useCallback, useState, useSyncExternalStore } from 'react'
import { useInterval } from '~/lib/hooks/useInterval'

export const useMachineTimeMs = (updateInterval: number): number => {
  const [now, setNow] = useState(Date.now())

  useInterval(
    useCallback(() => {
      setNow(Date.now())
    }, []),
    updateInterval,
  )
  return now
}

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
 * Like useMachineTimeMs, but all subscribers with the same interval share one module-level
 * clock: they tick in the same render pass and read the same timestamp, instead of drifting
 * out of phase on per-component timers (visible as ±1s jitter between sibling countdowns).
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
