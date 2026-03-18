import { datadogRum } from '@datadog/browser-rum'

export function logContextUpdate(contextName: string, newState: unknown): void {
  if (__DEV__) {
    return
  }

  datadogRum.addAction(contextName, {
    data: {
      newState,
    },
  })
}
