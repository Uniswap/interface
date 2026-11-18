import { Flex, Text, Tooltip, TouchableArea } from '@universe/mycelium'
import type { RateDisplay } from '@universe/transactions-ui/src/common/types'
import { useState } from 'react'

export interface ExchangeRateProps {
  /** Both directions, pre-formatted. */
  rate: RateDisplay
  /** Direction on first render. The form footer starts inverted. */
  defaultInverted?: boolean
  /** `primary` in transaction details, `secondary` (dimmer) in the form footer. */
  styling?: 'primary' | 'secondary'
  /** The footer instance is start-aligned; as a DetailRow value it is end-aligned. */
  align?: 'start' | 'end'
  testID?: string
}

/**
 * The exchange rate line, e.g. `1 ETH = 3,241.20 USDC ($3,240.11)`. Pressing it flips the
 * direction. The direction is visual state only this view needs, so it lives here.
 *
 * Used as a DetailRow value ("Rate") and on its own at the left of the form footer
 * (GasRow `leading`).
 *
 * @alias RateLine, PriceRatio, ConversionRate, TokenRatio
 */
export function ExchangeRate({
  rate,
  defaultInverted = false,
  styling = 'primary',
  align = 'start',
  testID,
}: ExchangeRateProps): JSX.Element {
  const [inverted, setInverted] = useState(defaultInverted)
  const isPrimary = styling === 'primary'
  const rateText = inverted ? rate.invertedRate : rate.rate
  const fiatText = inverted ? rate.invertedRateUsd : rate.rateUsd
  const fullPrecisionRate = inverted ? rate.invertedFullPrecisionRate : rate.fullPrecisionRate

  // `maxContent` + `shrink` keeps the natural width but lets an extreme rate hit the one-line
  // ellipsis instead of overflowing its neighbour; `flexWrap` drops the fiat part to a second line.
  const line = (
    <Flex row maxContent shrink flexWrap="wrap">
      <Text adjustsFontSizeToFit color={isPrimary ? '$neutral1' : '$neutral2'} numberOfLines={1} variant="body3">
        {rateText}
      </Text>
      <Text color={isPrimary ? '$neutral2' : '$neutral3'} variant="body3">
        {fiatText && ` (${fiatText})`}
      </Text>
    </Flex>
  )

  return (
    <TouchableArea
      flexDirection="row"
      flexGrow={1}
      flexShrink={1}
      justifyContent={align === 'end' ? 'flex-end' : 'flex-start'}
      testID={testID}
      onPress={() => setInverted(!inverted)}
    >
      {fullPrecisionRate ? (
        // An abbreviated rate (e.g. "1.24B") shows the exact value on hover.
        <Tooltip placement="top">
          <Tooltip.Trigger asChild>{line}</Tooltip.Trigger>
          <Tooltip.Content>
            <Tooltip.Arrow />
            <Text color="$neutral1" variant="body4">
              {fullPrecisionRate}
            </Text>
          </Tooltip.Content>
        </Tooltip>
      ) : (
        line
      )}
    </TouchableArea>
  )
}
