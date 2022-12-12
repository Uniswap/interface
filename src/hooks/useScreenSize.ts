import { useEffect, useState } from 'react'
import { BREAKPOINTS } from 'theme'

const isClient = typeof window !== 'undefined'

function getScreenSize(): Record<keyof typeof BREAKPOINTS, boolean> {
  return Object.keys(BREAKPOINTS).reduce(
    (obj, key) =>
      Object.assign(obj, {
        [key]: isClient ? window.innerWidth >= BREAKPOINTS[key as keyof typeof BREAKPOINTS] : false,
      }),
    {} as Record<keyof typeof BREAKPOINTS, boolean>
  )
}

export function useScreenSize(): Record<keyof typeof BREAKPOINTS, boolean> {
  const [screenSize, setScreenSize] = useState(getScreenSize())

  useEffect(() => {
    function handleResize() {
      setScreenSize(getScreenSize())
    }

    if (isClient) {
      window.addEventListener('resize', handleResize)
      return () => {
        window.removeEventListener('resize', handleResize)
      }
    }
    return undefined
  }, [])

  return screenSize
}