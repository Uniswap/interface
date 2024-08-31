import { DdRum, RumActionType } from '@datadog/mobile-react-native'
import { addSentryContextBreadcrumb } from 'utilities/src/logger/breadcrumbs'

export function logContextUpdate(contextName: string, newState: unknown, isDatadogEnabled: boolean): void {
  if (__DEV__) {
    return
  }
  addSentryContextBreadcrumb(contextName, newState)

  if (isDatadogEnabled) {
    DdRum.addAction(RumActionType.CUSTOM, `${contextName} Update`, {
      newState,
    }).catch(() => undefined)
  }
}
