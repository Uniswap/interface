import { useEffect } from 'react'
import { isMobile } from 'utils/userAgent'

export default function useDisableScrolling(disable: boolean | undefined | null) {
  useEffect(() => {
    if (disable && isMobile) {
      document.body.style.overflow = 'hidden'
    } else if (isMobile) {
      document.body.style.overflow = 'auto'
    }
  }, [disable])
}
