import { NavigationAction, NavigationState } from '@react-navigation/core'
import { navigationRef } from 'src/app/navigation/navigationRef'
import { RootParamList } from 'src/app/navigation/types'
import { logger } from 'utilities/src/logger/logger'

type RootNavigationArgs<RouteName extends keyof RootParamList> = undefined extends RootParamList[RouteName]
  ? [RouteName] | [RouteName, RootParamList[RouteName]]
  : [RouteName, RootParamList[RouteName]]

function isNavigationRefReady(): boolean {
  if (!navigationRef.isReady()) {
    logger.error(new Error('Navigator was called before it was initialized'), {
      tags: { file: 'rootNavigation', function: 'navigate' },
    })
    return false
  }
  return true
}

export function navigate<RouteName extends keyof RootParamList>(...args: RootNavigationArgs<RouteName>): void {
  const [routeName, params] = args
  if (!isNavigationRefReady()) {
    return
  }

  // Type assignment to `any` is a workaround until we figure out how to
  // type `createNavigationContainerRef` in a way that's compatible
  // biome-ignore lint/suspicious/noExplicitAny: Navigation refs need flexible typing
  navigationRef.navigate(routeName as any, params as never)
}

export function dispatchNavigationAction(
  action: NavigationAction | ((state: NavigationState) => NavigationAction),
): void {
  if (!isNavigationRefReady()) {
    return
  }

  navigationRef.dispatch(action)
}
