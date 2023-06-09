import { useEffect } from 'react'
import { isMobile } from 'utils/userAgent'

export default function useDisableScrolling(open: boolean | undefined | null) {
  useEffect(() => {
    if (open && isMobile) {
      document.body.style.overflow = 'hidden'
    } else if (isMobile) {
      document.body.style.overflow = 'auto'
    }
  }, [open])
}
