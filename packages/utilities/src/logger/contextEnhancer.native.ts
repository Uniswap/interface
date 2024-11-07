import { DdRum, RumActionType } from '@datadog/mobile-react-native'

export function logContextUpdate(contextName: string, newState: unknown, _isDatadogEnabled: boolean): void {
  if (__DEV__) {
    return
  }

  DdRum.addAction(RumActionType.CUSTOM, `${contextName} Update`, {
    newState,
  }).catch(() => undefined)
}
