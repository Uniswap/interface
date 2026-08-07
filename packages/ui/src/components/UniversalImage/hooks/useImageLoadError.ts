import { useCallback, useState } from 'react'

/**
 * Error state keyed by uri: an error only applies to the uri that failed,
 * so a new uri gets a fresh load attempt instead of staying stuck on the fallback.
 */
export function useImageLoadError(uri: string | number | undefined): {
  hasError: boolean
  markErrored: () => void
} {
  const [erroredUri, setErroredUri] = useState<string | number>()
  const [prevUri, setPrevUri] = useState(uri)

  // Reset during render (https://react.dev/reference/react/useState#storing-information-from-previous-renders)
  // so a remembered failure is cleared before the new uri's load events can fire
  if (uri !== prevUri) {
    setPrevUri(uri)
    setErroredUri(undefined)
  }

  const markErrored = useCallback(() => setErroredUri(uri), [uri])

  return { hasError: uri !== undefined && erroredUri === uri, markErrored }
}
