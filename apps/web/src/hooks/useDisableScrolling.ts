import { useEffect } from 'react'
import { isMobileWeb } from 'utilities/src/platform'

/** Disables scrolling of the main body on mobile when `true` is passed. Generally used for modals. */
export default function useDisableScrolling(disable: boolean | undefined | null) {
  useEffect(() => {
    if (!isMobileWeb) {
      return
    }
    document.body.style.overflow = disable ? 'hidden' : 'auto'
  }, [disable])
}
