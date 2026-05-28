import { RefObject, useEffect, useState } from 'react'

export function useTableBottomFade(tableBodyRef: RefObject<HTMLDivElement | null>, enabled: boolean): boolean {
  const [showFade, setShowFade] = useState(false)

  useEffect(() => {
    if (!enabled) {
      setShowFade(false)
      return undefined
    }

    // Use parentElement because the actual scrolling container is the parent wrapper,
    // not the table body div itself (which is a child of the scrollable container)
    const container = tableBodyRef.current?.parentElement
    if (!container) {
      return undefined
    }

    const handleScroll = () => {
      setShowFade(container.scrollTop + container.clientHeight < container.scrollHeight - 1)
    }

    handleScroll()
    container.addEventListener('scroll', handleScroll)
    const resizeObserver = new ResizeObserver(handleScroll)
    resizeObserver.observe(container)

    return () => {
      container.removeEventListener('scroll', handleScroll)
      resizeObserver.disconnect()
    }
  }, [tableBodyRef, enabled])

  return showFade
}
