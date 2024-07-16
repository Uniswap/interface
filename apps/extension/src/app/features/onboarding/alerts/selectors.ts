import { AlertsState } from 'src/app/features/onboarding/alerts/slice'
import { WebState } from 'src/store/webReducer'

export function selectAlertsState<T extends keyof AlertsState>(name: T): (state: WebState) => AlertsState[T] {
  return (state) => state.alerts[name]
}
