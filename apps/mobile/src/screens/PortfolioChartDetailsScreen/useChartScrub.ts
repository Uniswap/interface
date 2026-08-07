import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ChartData } from 'src/components/charts/SparklineChart'
import { useHapticFeedback } from 'uniswap/src/features/settings/useHapticFeedback/useHapticFeedback'

type ScrubValues = {
  total: number
  tokens: number | undefined
  pools: number | undefined
  earn: number | undefined
}

export function useChartScrub({
  tokensData,
  poolsData,
  earnData,
}: {
  tokensData?: ChartData
  poolsData?: ChartData
  earnData?: ChartData
} = {}): {
  chartScrubFiatValue: number | undefined
  chartScrubTokensValue: number | undefined
  chartScrubPoolsValue: number | undefined
  chartScrubEarnValue: number | undefined
  handleScrub: (point: ChartData[number] | null) => void
} {
  const { hapticFeedback } = useHapticFeedback()
  const [scrubValues, setScrubValues] = useState<ScrubValues | undefined>(undefined)
  const scrubValuesRef = useRef<ScrubValues | undefined>(undefined)
  const rafRef = useRef<ReturnType<typeof requestAnimationFrame> | null>(null)

  // The chart scrubs the total series; these let us read each category value at the same timestamp.
  const tokensByTimestamp = useMemo(() => new Map((tokensData ?? []).map((p) => [p.timestamp, p.value])), [tokensData])
  const poolsByTimestamp = useMemo(() => new Map((poolsData ?? []).map((p) => [p.timestamp, p.value])), [poolsData])
  const earnByTimestamp = useMemo(() => new Map((earnData ?? []).map((p) => [p.timestamp, p.value])), [earnData])

  const handleScrub = useCallback(
    (point: ChartData[number] | null) => {
      if (point === null) {
        if (rafRef.current !== null) {
          cancelAnimationFrame(rafRef.current)
          rafRef.current = null
        }
        scrubValuesRef.current = undefined
        setScrubValues(undefined)
        return
      }

      // Awaiting the haptic promise would block the scrub handler and degrade chart interaction responsiveness
      // oxlint-disable-next-line typescript/no-floating-promises -- fire-and-forget haptic for scrub performance
      hapticFeedback.light()
      scrubValuesRef.current = {
        total: point.value,
        tokens: tokensByTimestamp.get(point.timestamp),
        pools: poolsByTimestamp.get(point.timestamp),
        earn: earnByTimestamp.get(point.timestamp),
      }

      if (rafRef.current === null) {
        rafRef.current = requestAnimationFrame(() => {
          rafRef.current = null
          setScrubValues(scrubValuesRef.current)
        })
      }
    },
    [hapticFeedback, tokensByTimestamp, poolsByTimestamp, earnByTimestamp],
  )

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  }, [])

  return {
    chartScrubFiatValue: scrubValues?.total,
    chartScrubTokensValue: scrubValues?.tokens,
    chartScrubPoolsValue: scrubValues?.pools,
    chartScrubEarnValue: scrubValues?.earn,
    handleScrub,
  }
}
