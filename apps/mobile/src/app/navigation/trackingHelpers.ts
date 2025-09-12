import { DdRumReactNavigationTracking } from '@datadog/mobile-react-navigation'
import { NavigationContainerRefWithCurrent } from '@react-navigation/core'
import { NavigationState } from '@react-navigation/native'
import { navigationRef, navRefs } from 'src/app/navigation/navigationRef'
import { datadogEnabledBuild } from 'utilities/src/environment/constants'

/**
 * Since we are using multiple navigation containers, we need to start and stop tracking views
 * manually since multiple nav containers are not supported by the Datadog RUM.
 *
 * https://docs.datadoghq.com/real_user_monitoring/mobile_and_tv_monitoring/integrated_libraries/reactnative/#track-view-navigation
 */
export const startTracking = (
  navRefToStartTracking: NavigationContainerRefWithCurrent<ReactNavigation.RootParamList>,
): void => {
  if (!datadogEnabledBuild) {
    return
  }
  navRefs.forEach((navRef) => {
    DdRumReactNavigationTracking.stopTrackingViews(navRef.current)
  })
  DdRumReactNavigationTracking.startTrackingViews(navRefToStartTracking.current)
}

/**
 * Since we are using multiple navigation containers, we need to start and stop tracking views
 * manually since multiple nav containers are not supported by the Datadog RUM.
 *
 * https://docs.datadoghq.com/real_user_monitoring/mobile_and_tv_monitoring/integrated_libraries/reactnative/#track-view-navigation
 */
export const stopTracking = (state: NavigationState | undefined): void => {
  if (!datadogEnabledBuild) {
    return
  }
  const navContainerIsClosing = !state || state.routes.length === 0
  if (navContainerIsClosing) {
    navRefs.forEach((navRef) => {
      DdRumReactNavigationTracking.stopTrackingViews(navRef.current)
    })
    DdRumReactNavigationTracking.startTrackingViews(navigationRef.current)
  }
}
