/**
 * Web leg of the `useIsDarkMode` compat (`ui/src/hooks/useIsDarkMode`):
 * true when the root theme class is `dark`.
 */
import { useSyncExternalStore } from 'react'
import { getRootThemeSnapshot, getServerThemeSnapshot, subscribeToRootTheme } from './theme-state'

export function useIsDarkMode(): boolean {
  return useSyncExternalStore(subscribeToRootTheme, getRootThemeSnapshot, getServerThemeSnapshot) === 'dark'
}
