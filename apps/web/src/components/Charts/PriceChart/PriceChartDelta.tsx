import { useMemo } from 'react'
import { Text } from 'ui/src'
import { useFormatChartFiatDelta } from 'uniswap/src/features/fiatCurrency/hooks/useFormatChartFiatDelta'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { calculateDelta, DeltaArrow } from '~/components/DeltaArrow/DeltaArrow'

interface PriceChartDeltaProps {
  startingPrice: number
  endingPrice: number
  noColor?: boolean
  shouldIncludeFiatDelta?: boolean
  shouldTreatAsStablecoin?: boolean
  /** Optional price change % for the selected duration (used when not hovering) */
  pricePercentChange?: number
  /** Whether the user is currently hovering over the chart */
  isHovering?: boolean
  /** When true, hides the percentage but keeps the fiat delta amount */
  hidePercent?: boolean
}

export function PriceChartDelta({
  startingPrice,
  endingPrice,
  noColor,
  shouldIncludeFiatDelta = false,
  shouldTreatAsStablecoin = false,
  pricePercentChange,
  isHovering = false,
  hidePercent = false,
}: PriceChartDeltaProps) {
  const { formatPercent, convertFiatAmount } = useLocalizationContext()
  const { formatChartFiatDelta } = useFormatChartFiatDelta()

  // When not hovering and we have a percent change, use it
  // When hovering, calculate change from starting price to current hover point
  const calculatedDelta = calculateDelta(startingPrice, endingPrice)
  const delta = !isHovering && pricePercentChange !== undefined ? pricePercentChange : calculatedDelta

  const formattedDelta = useMemo(() => {
    return delta !== undefined ? formatPercent(Math.abs(delta)) : '-'
  }, [delta, formatPercent])

  const fiatDelta = useMemo(() => {
    if (!shouldIncludeFiatDelta) {
      return null
    }

    // When using percent change (not hovering), calculate fiat delta from that percentage
    // This avoids mixing aggregated chart prices with per-chain current prices
    if (!isHovering && pricePercentChange !== undefined) {
      const convertedEnd = convertFiatAmount(endingPrice)
      const percentAsDecimal = pricePercentChange / 100
      const historicalPrice = convertedEnd.amount / (1 + percentAsDecimal)
      const fiatChange = convertedEnd.amount - historicalPrice

      return formatChartFiatDelta({
        startingPrice: convertedEnd.amount - fiatChange,
        endingPrice: convertedEnd.amount,
        isStablecoin: shouldTreatAsStablecoin,
      })
    }

    // When hovering, use chart prices for consistent calculation
    const convertedStart = convertFiatAmount(startingPrice)
    const convertedEnd = convertFiatAmount(endingPrice)

    return formatChartFiatDelta({
      startingPrice: convertedStart.amount,
      endingPrice: convertedEnd.amount,
      isStablecoin: shouldTreatAsStablecoin,
    })
  }, [
    shouldIncludeFiatDelta,
    formatChartFiatDelta,
    startingPrice,
    endingPrice,
    convertFiatAmount,
    shouldTreatAsStablecoin,
    pricePercentChange,
    isHovering,
  ])

  return (
    <Text variant="body2" color="$neutral2" display="flex" alignItems="center" gap="$gap4">
      {delta !== undefined && (!hidePercent || fiatDelta !== null) && (
        <DeltaArrow delta={delta} formattedDelta={formattedDelta} noColor={noColor} />
      )}
      {hidePercent
        ? (fiatDelta?.formatted ?? null)
        : fiatDelta
          ? `${fiatDelta.formatted} (${formattedDelta})`
          : formattedDelta}
    </Text>
  )
}
