import { NavigationAction, NavigationState } from '@react-navigation/core'
import { navigationRef } from 'src/app/navigation/NavigationContainer'
import { RootParamList } from 'src/app/navigation/types'
import { logger } from 'src/utils/logger'

export type RootNavigationArgs<RouteName extends keyof RootParamList> =
  undefined extends RootParamList[RouteName]
    ? [RouteName] | [RouteName, RootParamList[RouteName]]
    : [RouteName, RootParamList[RouteName]]

function isNavigationRefReady(): boolean {
  if (!navigationRef.isReady()) {
    logger.error('rootNavigation', 'navigate', 'Navigator was called before it was initialized')
    return false
  }
  return true
}

export async function navigate<RouteName extends keyof RootParamList>(
  ...args: RootNavigationArgs<RouteName>
): Promise<void> {
  const [routeName, params] = args
  if (!isNavigationRefReady()) {
    return
  }

  // Type assignment to `never` is a workaround until we figure out how to
  // type `createNavigationContainerRef` in a way that's compatible
  navigationRef.navigate(routeName as never, params as never)
}

export async function goBack(): Promise<void> {
  if (!isNavigationRefReady()) {
    return
  }

  if (navigationRef.canGoBack()) navigationRef.goBack()
}

export async function dispatchNavigationAction(
  action: NavigationAction | ((state: NavigationState) => NavigationAction)
): Promise<void> {
  if (!isNavigationRefReady()) {
    return
  }

  navigationRef.dispatch(action)
}
