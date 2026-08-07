import { DynamicConfigs, SynchronizedHeartbeatsConfigKey, useDynamicConfigValue } from '@universe/gating'
import { useCallback, useEffect, useRef } from 'react'
import { PollingInterval } from 'uniswap/src/constants/misc'
import { ONE_SECOND_MS, SECONDS_IN_MINUTE } from 'utilities/src/time/time'
import { useInterval } from '~/lib/hooks/useInterval'
import { usePageVisibility } from '~/lib/hooks/usePageVisibility'

const DEFAULT_POLL_INTERVAL_SECONDS = 15 * SECONDS_IN_MINUTE

/** Fixed price tick cadence — the config only tunes the non-price refresh cadence. */
export const HEARTBEAT_PRICE_INTERVAL_MS = PollingInterval.KindaFast

/** Seconds between full heartbeat refreshes for a page, from the synchronized_heartbeats config. 0 disables that page's heartbeat. */
export function useHeartbeatPollIntervalSeconds(configKey: SynchronizedHeartbeatsConfigKey): number {
  return useDynamicConfigValue({
    config: DynamicConfigs.SynchronizedHeartbeats,
    key: configKey,
    defaultValue: DEFAULT_POLL_INTERVAL_SECONDS,
  })
}

/**
 * Whether a page's heartbeat is active — consumers use this to disable their own overlapping polls.
 * `enabled` must match the same condition passed to that page's heartbeat coordinator, otherwise a
 * consumer can disable its self-poll while the coordinator itself stays inactive, freezing the data.
 */
export function useIsSynchronizedHeartbeatEnabled(
  configKey: SynchronizedHeartbeatsConfigKey,
  enabled: boolean,
): boolean {
  return useHeartbeatPollIntervalSeconds(configKey) > 0 && enabled
}

interface UseHeartbeatTickParams {
  /** Non-price refresh, fired at the page's configured poll interval. */
  refresh: () => Promise<unknown>
  /** Optional price refresh, fired every 30s regardless of the configured interval. Pages that pass this must disable their own price polls while the heartbeat runs. */
  priceRefresh?: () => Promise<unknown>
  /** Seconds between full refreshes. 0 disables the heartbeat. */
  pollIntervalSeconds: number
  enabled: boolean
}

/** Shared tick machinery for the web page heartbeats, paused while the page is hidden. */
function useHeartbeatTick({ refresh, priceRefresh, pollIntervalSeconds, enabled }: UseHeartbeatTickParams): void {
  const isVisible = usePageVisibility()
  const isActive = pollIntervalSeconds > 0 && enabled
  const hasPriceRefresh = priceRefresh !== undefined

  const fullIntervalMs = pollIntervalSeconds * ONE_SECOND_MS
  // With a price refresh the timer runs at the price cadence; the full refresh fires on the price tick closest to the configured interval.
  const ticksPerFullRefresh = Math.max(1, Math.round(fullIntervalMs / HEARTBEAT_PRICE_INTERVAL_MS))

  const latestRef = useRef({ refresh, priceRefresh, ticksPerFullRefresh })
  useEffect(() => {
    latestRef.current = { refresh, priceRefresh, ticksPerFullRefresh }
  })

  const tickCountRef = useRef(0)
  const stableTick = useCallback(async () => {
    const { refresh: fullRefresh, priceRefresh: price, ticksPerFullRefresh: ticksPerFull } = latestRef.current
    if (!price) {
      await fullRefresh()
      return
    }
    const isFullTick = tickCountRef.current % ticksPerFull === 0
    tickCountRef.current += 1
    const tasks: Promise<unknown>[] = [price()]
    if (isFullTick) {
      tasks.push(fullRefresh())
    }
    await Promise.allSettled(tasks)
  }, [])

  const intervalMs = hasPriceRefresh ? HEARTBEAT_PRICE_INTERVAL_MS : fullIntervalMs
  const delay = isActive && isVisible ? intervalMs : null
  useInterval(stableTick, delay, false)

  const prevVisibleRef = useRef(isVisible)
  useEffect(() => {
    if (isVisible && !prevVisibleRef.current && isActive) {
      // Fire a full tick immediately on visibility restore and restart the phase
      tickCountRef.current = 1
      const { refresh: fullRefresh, priceRefresh: price } = latestRef.current
      const tasks: Promise<unknown>[] = [fullRefresh()]
      if (price) {
        tasks.push(price())
      }
      Promise.allSettled(tasks).catch(() => {})
    }
    prevVisibleRef.current = isVisible
  }, [isVisible, isActive])
}

interface UseHeartbeatCoordinatorParams {
  /** Non-price refresh, fired at the page's configured poll interval. */
  refresh: () => Promise<unknown>
  /** Optional price refresh, fired every 30s regardless of the configured interval. Pages that pass this must disable their own price polls while the heartbeat runs. */
  priceRefresh?: () => Promise<unknown>
  configKey: SynchronizedHeartbeatsConfigKey
  enabled: boolean
}

/**
 * Heartbeat for pages gated by the synchronized_heartbeats config — cadence and kill switch read
 * from that config in one place.
 */
export function useHeartbeatCoordinator({
  refresh,
  priceRefresh,
  configKey,
  enabled,
}: UseHeartbeatCoordinatorParams): void {
  const pollIntervalSeconds = useHeartbeatPollIntervalSeconds(configKey)
  useHeartbeatTick({ refresh, priceRefresh, pollIntervalSeconds, enabled })
}

interface UseFixedIntervalHeartbeatCoordinatorParams {
  /** Non-price refresh, fired every `pollIntervalSeconds`. */
  refresh: () => Promise<unknown>
  /** Optional price refresh, fired every 30s regardless of pollIntervalSeconds. Pages that pass this must disable their own price polls while the heartbeat runs. */
  priceRefresh?: () => Promise<unknown>
  /** Fixed seconds between full refreshes — not driven by the synchronized_heartbeats config. */
  pollIntervalSeconds: number
  enabled: boolean
}

/** Heartbeat for pages on a fixed cadence, outside the synchronized_heartbeats config. */
export function useFixedIntervalHeartbeatCoordinator({
  refresh,
  priceRefresh,
  pollIntervalSeconds,
  enabled,
}: UseFixedIntervalHeartbeatCoordinatorParams): void {
  useHeartbeatTick({ refresh, priceRefresh, pollIntervalSeconds, enabled })
}
