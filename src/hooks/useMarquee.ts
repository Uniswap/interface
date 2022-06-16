import React, { useRef, useState } from 'react'
import { useDeepCompareEffect } from 'react-use'

export default function useMarquee(...args: any): React.RefObject<HTMLDivElement> {
  const marqueeContainerRef = useRef<HTMLDivElement>(null)
  const [endScroll, setEndScroll] = useState(false)

  useDeepCompareEffect(() => {
    let itv: NodeJS.Timeout | undefined
    if (marqueeContainerRef && marqueeContainerRef.current && !endScroll) {
      let lastScrollLeft = marqueeContainerRef.current.scrollLeft
      itv = setInterval(() => {
        if (
          marqueeContainerRef.current &&
          marqueeContainerRef.current.scrollLeft + marqueeContainerRef.current.clientWidth <
            marqueeContainerRef.current.scrollWidth - 1
        ) {
          const acceleration = Math.abs(lastScrollLeft - marqueeContainerRef.current.scrollLeft)
          if (acceleration >= 30) {
            setEndScroll(true)
            return
          }

          if (!endScroll) {
            marqueeContainerRef.current.scrollTo({
              left: marqueeContainerRef.current.scrollLeft + 1,
            })
            lastScrollLeft = marqueeContainerRef.current.scrollLeft
          }
        } else {
          setEndScroll(true)
        }
      }, 50)
    }

    return () => {
      itv && clearInterval(itv)
    }
  }, [...args, endScroll])

  return marqueeContainerRef
}
