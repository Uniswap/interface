import { useCallback, useEffect, useRef, useState } from 'react'
import type { ChartData } from 'src/components/home/PortfolioChart/SparklineChart'
import { useHapticFeedback } from 'uniswap/src/features/settings/useHapticFeedback/useHapticFeedback'

export function useChartScrub(): {
  chartScrubFiatValue: number | undefined
  handleScrub: (point: ChartData[number] | null) => void
} {
  const { hapticFeedback } = useHapticFeedback()
  const [chartScrubFiatValue, setChartScrubFiatValue] = useState<number | undefined>(undefined)
  const scrubValueRef = useRef<number | undefined>(undefined)
  const rafRef = useRef<ReturnType<typeof requestAnimationFrame> | null>(null)

  const handleScrub = useCallback(
    (point: ChartData[number] | null) => {
      if (point === null) {
        if (rafRef.current !== null) {
          cancelAnimationFrame(rafRef.current)
          rafRef.current = null
        }
        scrubValueRef.current = undefined
        setChartScrubFiatValue(undefined)
        return
      }

      // Awaiting the haptic promise would block the scrub handler and degrade chart interaction responsiveness
      // oxlint-disable-next-line typescript/no-floating-promises -- fire-and-forget haptic for scrub performance
      hapticFeedback.light()
      scrubValueRef.current = point.value

      if (rafRef.current === null) {
        rafRef.current = requestAnimationFrame(() => {
          rafRef.current = null
          setChartScrubFiatValue(scrubValueRef.current)
        })
      }
    },
    [hapticFeedback],
  )

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  }, [])

  return { chartScrubFiatValue, handleScrub }
}
