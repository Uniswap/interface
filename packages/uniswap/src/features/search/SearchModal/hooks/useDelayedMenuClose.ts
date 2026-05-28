import { useEffect, useRef } from 'react'
import { MENU_CLOSE_DELAY_MS } from 'uniswap/src/features/search/SearchModal/constants'

/**
 * Closes a context menu after a short delay when the row loses hover focus,
 * giving the user a grace period to move the mouse back before dismissal.
 * Cancels the timer automatically if the row regains focus.
 */
export function useDelayedMenuClose({
  isVisible,
  isOpen,
  closeMenu,
}: {
  isVisible: boolean
  isOpen: boolean
  closeMenu: () => void
}): void {
  const closeTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    if (!isVisible && isOpen) {
      closeTimerRef.current = setTimeout(closeMenu, MENU_CLOSE_DELAY_MS)
    }
    return () => clearTimeout(closeTimerRef.current)
  }, [isVisible, isOpen, closeMenu])
}
