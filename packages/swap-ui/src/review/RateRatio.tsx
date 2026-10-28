import { Flex, type FlexProps, Text, TouchableArea } from '@universe/mycelium'
import { TooltipCompat as Tooltip } from '@universe/mycelium/tooltip-compat'
import { useState } from 'react'
import type { RateDisplay } from '../types'

export type RateRatioStyling = 'primary' | 'secondary'

export interface RateRatioProps {
  rate: RateDisplay
  styling?: RateRatioStyling
  initialInverse?: boolean
  justifyContent?: FlexProps['justifyContent']
}

/**
 * The swap rate line with a tap-to-invert toggle. Which orientation is shown is visual
 * state and lives here; the strings themselves are computed upstream.
 */
export function RateRatio({
  rate,
  styling = 'primary',
  initialInverse = false,
  justifyContent = 'flex-start',
}: RateRatioProps): JSX.Element {
  const [showInverseRate, setShowInverseRate] = useState(initialInverse)
  const isPrimary = styling === 'primary'
  const latestRate = showInverseRate ? rate.invertedRate : rate.rate
  const fullPrecisionRate = showInverseRate ? rate.invertedFullPrecisionRate : rate.fullPrecisionRate
  const rateAmountUSD = showInverseRate ? rate.invertedRateUsd : rate.rateUsd

  // `maxContent` keeps this row at its natural width when there's room, but without `shrink`
  // it could never compress below that width, so an extreme-length rate would overflow its
  // neighbour instead of hitting the numberOfLines=1 ellipsis. `flexWrap` is the fallback for
  // when even the ellipsized rate plus the "(~$X)" amount cannot share one line: the USD text
  // drops to a second line; the rate itself still never wraps.
  const rateRow = (
    <Flex row maxContent shrink flexWrap="wrap">
      <Text adjustsFontSizeToFit color={isPrimary ? '$neutral1' : '$neutral2'} numberOfLines={1} variant="body3">
        {latestRate}
      </Text>
      <Text color={isPrimary ? '$neutral2' : '$neutral3'} variant="body3">
        {rateAmountUSD && ` (${rateAmountUSD})`}
      </Text>
    </Flex>
  )

  return (
    <TouchableArea
      flexDirection="row"
      justifyContent={justifyContent}
      flexGrow={1}
      flexShrink={1}
      onPress={() => setShowInverseRate(!showInverseRate)}
    >
      {fullPrecisionRate ? (
        // The rate abbreviates once it is large (e.g. "1.24B"); the exact value is one hover away.
        <Tooltip placement="top">
          <Tooltip.Trigger asChild>{rateRow}</Tooltip.Trigger>
          <Tooltip.Content>
            <Tooltip.Arrow />
            <Text variant="body4" color="$neutral1">
              {fullPrecisionRate}
            </Text>
          </Tooltip.Content>
        </Tooltip>
      ) : (
        rateRow
      )}
    </TouchableArea>
  )
}
