import { useMedia } from 'ui/src'

// when company menu dropdown transitions to a bottom sheet
export function useIsMobileDrawer(): boolean {
  const media = useMedia()
  return media.sm
}

// When tabs are visible in the top level of nav (not in dropdown)
export function useTabsVisible(): boolean {
  const media = useMedia()
  return !media.md
}
