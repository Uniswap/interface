/**
 * Returns whether the window/document is currently visible to the user.
 * On native, this always returns true since native apps don't have the concept of "hidden tabs".
 *
 * For native app background/foreground state, use `useOnMobileAppState` from `utilities/src/device/appState` instead.
 */
export function useIsWindowVisible(): boolean {
  return true
}
