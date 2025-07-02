import { DdRum, RumActionType } from '@datadog/mobile-react-native'
import { DDRumAction } from 'utilities/src/logger/datadog/datadogEvents'

export function logContextUpdate(contextName: string, newState: unknown): void {
  if (__DEV__) {
    return
  }

  DdRum.addAction(RumActionType.CUSTOM, DDRumAction.Context(contextName), {
    newState,
  }).catch(() => undefined)
}
