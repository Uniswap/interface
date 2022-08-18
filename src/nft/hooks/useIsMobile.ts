import { breakpoints } from 'nft/css/sprinkles.css'
import { useEffect, useState } from 'react'

const isClient = typeof window === 'object'

function getIsMobile() {
  return isClient ? window.innerWidth < breakpoints.tabletSm : false
}

export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(getIsMobile)

  useEffect(() => {
    function handleResize() {
      setIsMobile(getIsMobile())
    }

    if (isClient) {
      window.addEventListener('resize', handleResize)
      return () => {
        window.removeEventListener('resize', handleResize)
      }
    }
    return undefined
  }, [])

  return isMobile
}
