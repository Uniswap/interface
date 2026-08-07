import { createContext, useContext } from 'react'

/**
 * True when the create-auction wizard is hosted inside the launches-page quick-launch modal:
 * the flow is locked to quick launch (source/mode toggles hidden) and the review screen is
 * skipped — submitting the form opens the review-and-sign modal directly.
 * Defaults to false so the standalone /create route is unchanged.
 */
export const QuickLaunchModalContext = createContext(false)

export function useIsQuickLaunchModalFlow(): boolean {
  return useContext(QuickLaunchModalContext)
}
