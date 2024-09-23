import { useScreenSize } from 'hooks/screenSize'
import { BREAKPOINTS } from 'theme'

export const NAV_BREAKPOINT = {
  isMobileDrawer: 450,
  areTabsVisible: BREAKPOINTS.sm,
  showMobileBar: BREAKPOINTS.lg + 1,
  collapseSearchBar: BREAKPOINTS.md,
}

// When the nav dropdown transitions into a drawer that slides up from the bottom
// IMPORTANT NOTE:
//    For some reason the drawer transitions at 450px, which doesn't match the sm breakpoint which is being passed in
//    We're using this file to help with smooth breakpoint transitions across all nav components
export function useIsMobileDrawer(): boolean {
  const isScreenSize = useScreenSize()
  const isMobileDrawer = !isScreenSize['navDropdownMobileDrawer']

  return isMobileDrawer
}

// When tabs are visible in the top level of nav (not in dropdown)
export function useTabsVisible(): boolean {
  const isScreenSize = useScreenSize()
  const areTabsVisible = isScreenSize['sm']

  return areTabsVisible
}
