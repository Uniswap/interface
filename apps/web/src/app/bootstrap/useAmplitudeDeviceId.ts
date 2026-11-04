import { getDeviceId } from '@amplitude/analytics-browser'
import { useEffect, useState } from 'react'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

const AMPLITUDE_DEVICE_ID_MAX_WAIT_MS = 3 * ONE_SECOND_MS
const AMPLITUDE_DEVICE_ID_POLL_INTERVAL_MS = 50

/**
 * Amplitude assigns its device id asynchronously during `setupAmplitude`, so `getDeviceId()`
 * can be undefined on first render. The Statsig SDK captures the user once at client
 * construction — initializing with `userID: undefined` buckets all racing sessions together
 * for the whole session. Bounded wait, mirroring the extension's guard
 * (`ExtensionStatsigProvider`): after the cap we proceed with whatever id is available rather
 * than blocking the app on analytics.
 *
 * TODO(INFRA-3082): delete this poll once the device id is resolved during bootstrap, before
 * the app renders (#41544) — at that point the wait can never be pending and this is dead code.
 *
 * @returns the Amplitude device id, whether the bounded wait is still in progress, and whether
 * it ended by hitting the cap rather than by an id arriving.
 */
export function useAmplitudeDeviceId(): {
  deviceId: string | undefined
  isDeviceIdPending: boolean
  didTimeOut: boolean
} {
  const [state, setState] = useState(() => {
    const deviceId = getDeviceId()
    return { deviceId, isDeviceIdPending: !deviceId, didTimeOut: false }
  })

  useEffect(() => {
    if (!state.isDeviceIdPending) {
      return undefined
    }
    const startTime = Date.now()
    const interval = setInterval(() => {
      const deviceId = getDeviceId()
      if (deviceId) {
        setState({ deviceId, isDeviceIdPending: false, didTimeOut: false })
        return
      }
      if (Date.now() - startTime >= AMPLITUDE_DEVICE_ID_MAX_WAIT_MS) {
        // Give up: this session initializes Statsig with `userID: undefined`, bounded to
        // slow/failed Amplitude init. The caller reports `didTimeOut` once Datadog is up, so
        // the residual rate stays measurable.
        setState({ deviceId, isDeviceIdPending: false, didTimeOut: true })
      }
    }, AMPLITUDE_DEVICE_ID_POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [state.isDeviceIdPending])

  return state
}
