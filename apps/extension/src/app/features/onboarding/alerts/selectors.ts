import { AlertsState } from 'src/app/features/onboarding/alerts/slice'
import { ExtensionState } from 'src/store/extensionReducer'

export function selectAlertsState<T extends keyof AlertsState>(name: T): (state: ExtensionState) => AlertsState[T] {
  return (state) => state.alerts[name]
}
