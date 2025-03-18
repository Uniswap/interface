import { useEffect, useState } from 'react'
import { DeviceDimensions } from 'ui/src/hooks/useDeviceDimensions/useDeviceDimensions'
import { breakpoints } from 'ui/src/theme'
import { logger } from 'utilities/src/logger/logger'
import { isExtension } from 'utilities/src/platform'

const isClient = typeof window === 'object'

function getDeviceDimensions(): DeviceDimensions {
  return {
    fullHeight: window.innerHeight,
    fullWidth: window.innerWidth,
  }
}

async function getExtensionDeviceDimensions(): Promise<DeviceDimensions> {
  const window = await chrome.windows.getCurrent()
  return {
    fullHeight: window.height ?? 0,
    fullWidth: window.width ?? 0,
  }
}

// based on https://usehooks.com/useWindowSize/
// Additional logic added to handle getting the extension window size
export const useDeviceDimensions = (): DeviceDimensions => {
  const [deviceDimensions, setDeviceDimensions] = useState(getDeviceDimensions)

  useEffect(() => {
    if (isExtension) {
      getExtensionDeviceDimensions()
        .then((size) => setDeviceDimensions(size))
        .catch((error) => {
          logger.error('Error getting extension window size', error)
        })
    }
    async function handleResize(): Promise<void> {
      setDeviceDimensions(isExtension ? await getExtensionDeviceDimensions() : getDeviceDimensions())
    }

    if (isClient) {
      window.addEventListener('resize', handleResize)
      return () => {
        window.removeEventListener('resize', handleResize)
      }
    }
    return undefined
  }, [])

  return deviceDimensions
}

export const useIsExtraLargeScreen = (): boolean => {
  const { fullWidth } = useDeviceDimensions()
  return fullWidth >= breakpoints.xl
}
