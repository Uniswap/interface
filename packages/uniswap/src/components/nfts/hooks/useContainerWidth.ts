import { RefObject, useEffect, useState } from 'react'

export function useContainerWidth(ref: RefObject<HTMLElement | null>): number {
  const [containerWidth, setContainerWidth] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) {
      return
    }
    const observer = new ResizeObserver(([entry]) => {
      if (entry) {
        setContainerWidth(entry.contentRect.width)
      }
    })
    observer.observe(el)
    setContainerWidth(el.getBoundingClientRect().width)
    // oxlint-disable-next-line typescript/consistent-return -- biome-parity: oxlint is stricter here
    return () => observer.disconnect()
  }, [ref])

  return containerWidth
}
