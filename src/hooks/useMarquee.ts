import React, { useRef, useState } from 'react'
import { useDeepCompareEffect } from 'react-use'

export default function useMarquee(...args: any): React.RefObject<HTMLDivElement> {
  const marqueeContainerRef = useRef<HTMLDivElement>(null)
  const [endScroll, setEndScroll] = useState(false)
  useDeepCompareEffect(() => {
    let itv: NodeJS.Timeout | undefined
    const container = marqueeContainerRef?.current
    if (container && !endScroll) {
      let lastScrollLeft = container.scrollLeft
      itv = setInterval(() => {
        const { scrollLeft, clientWidth, scrollWidth } = container ?? {}
        if (container && scrollLeft + clientWidth < scrollWidth - 1) {
          const acceleration = Math.abs(lastScrollLeft - scrollLeft)
          if (acceleration >= 30) {
            setEndScroll(true)
            return
          }
          if (!endScroll) {
            container.scrollTo({
              left: scrollLeft + 1,
            })
            lastScrollLeft = scrollLeft
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
