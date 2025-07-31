import { useDispatch, useSelector } from 'react-redux'
import { areSameDays } from 'utilities/src/time/date'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { useInterval } from 'utilities/src/time/timing'
import { selectAllowAnalytics, selectLastHeartbeat } from 'wallet/src/features/telemetry/selectors'
import { recordHeartbeat } from 'wallet/src/features/telemetry/slice'

/**
 * Returns a function that checks if the app needs to send a heartbeat action to record anonymous DAU
 * Only logs when the user has allowing product analytics off and a heartbeat has not been sent for the user's local day
 */
export function useHeartbeatReporter({ isOnboarded }: { isOnboarded: boolean }): void {
  const dispatch = useDispatch()
  const allowAnalytics = useSelector(selectAllowAnalytics)
  const lastHeartbeat = useSelector(selectLastHeartbeat)

  const reporter = (): void => {
    if (!allowAnalytics && isOnboarded) {
      const nowDate = new Date(Date.now())
      const lastHeartbeatDate = new Date(lastHeartbeat)
      const heartbeatDue = !areSameDays(nowDate, lastHeartbeatDate)
      if (heartbeatDue) {
        dispatch(recordHeartbeat())
      }
    }
  }

  useInterval(reporter, ONE_SECOND_MS * 15, true)
}
