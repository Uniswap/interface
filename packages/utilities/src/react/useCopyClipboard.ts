import { useCallback, useEffect, useState } from 'react'
import { setClipboard } from 'utilities/src/clipboard/clipboard'
import { logger } from 'utilities/src/logger/logger'

export function useCopyClipboard(timeout = 500): [boolean, (toCopy: string) => Promise<void>] {
  const [isCopied, setIsCopied] = useState(false)

  const staticCopy = useCallback((text: string): Promise<void> => {
    return setClipboard(text)
      .then(() => {
        setIsCopied(true)
      })
      .catch((error) => {
        logger.error(error, {
          tags: { file: 'useCopyClipboard', function: 'staticCopy' },
        })
        throw error
      })
  }, [])

  useEffect(() => {
    if (isCopied) {
      const hide = setTimeout(() => {
        setIsCopied(false)
      }, timeout)

      return () => {
        clearTimeout(hide)
      }
    }
    return undefined
  }, [isCopied, timeout])

  return [isCopied, staticCopy]
}
