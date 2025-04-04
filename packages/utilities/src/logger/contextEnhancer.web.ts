import { datadogRum } from '@datadog/browser-rum'
import { addSentryContextBreadcrumb } from 'utilities/src/logger/breadcrumbs'

export function logContextUpdate(contextName: string, newState: unknown, _isDatadogEnabled: boolean): void {
  if (__DEV__) {
    return
  }
  datadogRum.addAction(contextName, {
    data: {
      newState,
    },
  })
  addSentryContextBreadcrumb(contextName, newState)
}
