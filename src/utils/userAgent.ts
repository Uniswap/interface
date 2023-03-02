import { useMemo } from 'react'
import { UAParser } from 'ua-parser-js'

export const useIsMobile = () => {
  const type = useMemo(() => {
    const parser = new UAParser(window.navigator.userAgent)
    return parser.getDevice().type
  }, [])

  return type === 'mobile' || type === 'tablet'
}
