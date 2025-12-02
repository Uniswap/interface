import { useEffect, useRef, useState } from 'react'

export function usePreventOverflowBelowFold(isVisible = true): {
  maxHeight: number
  ref: React.RefObject<HTMLDivElement>
} {
  const ref = useRef<HTMLDivElement>(null)
  const [maxHeight, setMaxHeight] = useState(0)

  const getMaxHeight = (): number => {
    const menuTopY = ref.current?.getBoundingClientRect().top || 0

    const diff = window.innerHeight - menuTopY
    return diff > 0 ? diff : 0
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: we want to trigger this effect when isVisible changes
  useEffect(() => {
    // Effectively waits for the menu to render before calculating the offset
    setTimeout(() => {
      setMaxHeight(getMaxHeight())
    }, 0)
  }, [isVisible])

  return { maxHeight, ref }
}
