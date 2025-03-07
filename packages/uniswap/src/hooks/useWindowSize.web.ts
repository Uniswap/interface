import { useEffect, useState } from 'react'
import { breakpoints } from 'ui/src/theme'
import type { WindowSize } from 'uniswap/src/hooks/useWindowSize'
import { logger } from 'utilities/src/logger/logger'
import { isExtension } from 'utilities/src/platform'

const isClient = typeof window === 'object'

function getWindowSize(): WindowSize {
  return {
    width: isClient ? window.innerWidth : undefined,
    height: isClient ? window.innerHeight : undefined,
  }
}

async function getExtensionWindowSize(): Promise<WindowSize> {
  const window = await chrome.windows.getCurrent()
  return {
    width: window.width,
    height: window.height,
  }
}

// https://usehooks.com/useWindowSize/
// Additional logic added to handle getting the extension window size
export function useWindowSize(): WindowSize {
  const [windowSize, setWindowSize] = useState(getWindowSize)

  useEffect(() => {
    if (isExtension) {
      getExtensionWindowSize()
        .then((size) => setWindowSize(size))
        .catch((error) => {
          logger.error('Error getting extension window size', error)
        })
    }

    async function handleResize(): Promise<void> {
      setWindowSize(isExtension ? await getExtensionWindowSize() : getWindowSize())
    }

    if (isClient) {
      window.addEventListener('resize', handleResize)
      return () => {
        window.removeEventListener('resize', handleResize)
      }
    }
    return undefined
  }, [])

  return windowSize
}

/**
 * Returns true if the desktop or extension window width is larger than the xl breakpoint (tablet size).
 * This hook is useful for conditionally rendering UI elements that should only appear on larger desktop screens where the isMobile check does not work based on device.
 * @returns {boolean} True if screen width >= xl breakpoint (larger than tablet size)
 */
export function useIsExtraLargeScreen(): boolean {
  const { width } = useWindowSize()
  return !!width && width >= breakpoints.xl
}
