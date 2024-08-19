import { addSentryContextBreadcrumb } from 'utilities/src/logger/breadcrumbs'

export function logContextUpdate(contextName: string, newState: unknown, _isDatadogEnabled: boolean): void {
  addSentryContextBreadcrumb(contextName, newState)
}
