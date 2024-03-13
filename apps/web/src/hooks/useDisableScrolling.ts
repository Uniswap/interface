import { useEffect } from 'react'
import { isMobile } from 'uniswap/src/utils/platform'

/** Disables scrolling of the main body on mobile when `true` is passed. Generally used for modals. */
export default function useDisableScrolling(disable: boolean | undefined | null) {
  useEffect(() => {
    if (!isMobile) return
    document.body.style.overflow = disable ? 'hidden' : 'auto'
  }, [disable])
}
