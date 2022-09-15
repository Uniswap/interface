import { breakpoints } from 'nft/css/sprinkles.css'
import { useEffect, useState } from 'react'

const isClient = typeof window !== 'undefined'

function getIsTablet() {
  return isClient ? window.innerWidth < breakpoints.lg && window.innerWidth >= breakpoints.sm : false
}

export function useIsTablet(): boolean {
  const [isTablet, setIsTablet] = useState(getIsTablet)

  useEffect(() => {
    function handleResize() {
      setIsTablet(getIsTablet())
    }

    if (isClient) {
      window.addEventListener('resize', handleResize)
      return () => {
        window.removeEventListener('resize', handleResize)
      }
    }
    return undefined
  }, [])

  return isTablet
}
