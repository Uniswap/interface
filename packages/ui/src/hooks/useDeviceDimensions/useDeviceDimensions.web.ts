import { useEffect, useState } from 'react'
import { useWindowDimensions } from 'react-native'
import { DeviceDimensions } from 'ui/src/hooks/useDeviceDimensions/useDeviceDimensions'
import { breakpoints } from 'ui/src/theme'
import { isExtensionApp } from 'utilities/src/platform'

const isClient = typeof window === 'object'

function getDeviceDimensions(): DeviceDimensions {
  return {
    fullHeight: window.innerHeight,
    fullWidth: window.innerWidth,
  }
}

// based on https://usehooks.com/useWindowSize/
// Additional logic added to handle getting the extension window size
export const useDeviceDimensions = (): DeviceDimensions => {
  const [deviceDimensions, setDeviceDimensions] = useState(getDeviceDimensions)

  // handles interface resize
  useEffect(() => {
    function handleResize(): void {
      setDeviceDimensions(getDeviceDimensions())
    }

    if (isExtensionApp) {
      handleResize()
    }

    if (!isClient) {
      return undefined
    }

    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  // handles extension resize
  const { width: extensionWidth, height: extensionHeight } = useWindowDimensions()

  if (isExtensionApp) {
    return {
      fullHeight: extensionHeight,
      fullWidth: extensionWidth,
    }
  }

  return deviceDimensions
}

export const useIsExtraLargeScreen = (): boolean => {
  const { fullWidth } = useDeviceDimensions()
  return fullWidth >= breakpoints.xl
}
