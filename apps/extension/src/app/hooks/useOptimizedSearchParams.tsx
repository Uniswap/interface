import { useEffect, useState } from 'react'
import { createSearchParams } from 'react-router'
import { getRouter } from 'src/app/navigation/state'
import { sleep } from 'utilities/src/time/timing'

const getSearchParams = (): URLSearchParams => createSearchParams(new URLSearchParams(window.location.hash.slice(2)))

/**
 * It's just like useSearchParams but avoids re-rendering on every page navigation
 */

export function useOptimizedSearchParams(): URLSearchParams {
  const [searchParams, setSearchParams] = useState(getSearchParams)

  useEffect(() => {
    return getRouter().subscribe(async () => {
      // react-router calls this before it actually updates the url bar :/
      await sleep(0)
      setSearchParams((prev) => {
        const next = getSearchParams()
        if (prev.toString() !== next.toString()) {
          return next
        }
        return prev
      })
    })
  }, [])

  return searchParams
}
