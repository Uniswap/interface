import { CommonActions } from '@react-navigation/core'
import { navigationRef } from 'src/app/navigation/navigationRef'
import { dispatchNavigationAction } from 'src/app/navigation/rootNavigation'
import { closeAllModals } from 'src/features/modals/modalSlice'
import { call, put } from 'typed-redux-saga'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'

/**
 * Helper function to dismiss all open modals before navigating to a deep link target.
 * This ensures the target screen is visible and not hidden behind any modals.
 */
export function* dismissAllModalsBeforeNavigation(): Generator {
  // Close all Redux-managed modals
  yield* put(closeAllModals())

  // Dismiss React Navigation modals by going back to the first non-modal screen
  if (navigationRef.isReady()) {
    yield* call(dismissReactNavigationModalsWithoutAnimation)
  }
}

/**
 * Helper function to dismiss React Navigation modals without resetting the stack.
 * This preserves the current screen state and prevents re-animation of the home screen.
 */
function* dismissReactNavigationModalsWithoutAnimation(): Generator {
  const navigationState = navigationRef.getState()

  // Early return if navigationState is not available (e.g., in tests, or if modal has no state)
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!navigationState || !navigationState.routes) {
    return
  }

  // Find the index of the first non-modal screen (usually Home)
  const homeScreenIndex = navigationState.routes.findIndex((route) => route.name === MobileScreens.Home)

  // If we're already on the home screen or no modals are open, no action needed
  if (homeScreenIndex === -1 || navigationState.index === homeScreenIndex) {
    return
  }

  // Calculate how many screens we need to go back to reach the home screen
  const modalsToClose = navigationState.index - homeScreenIndex

  // Go back multiple times to dismiss modals without resetting the stack
  for (let i = 0; i < modalsToClose; i++) {
    if (navigationRef.canGoBack()) {
      yield* call(dispatchNavigationAction, CommonActions.goBack())
    }
  }
}
