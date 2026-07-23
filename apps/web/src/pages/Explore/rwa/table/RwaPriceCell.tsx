import { Flex, Text } from 'ui/src'
import type { RwaPriceDisplay } from 'uniswap/src/data/rest/rwa/rwaMetrics'
import { NumberType, type FiatNumberType, type PercentNumberDecimals } from 'utilities/src/format/types'
import { TableText } from '~/components/Table/shared/TableText'

export function formatRwaPriceDeviationLabel(
  priceDeviationPct: number,
  formatPercent: (value: number | undefined, maxDecimals?: PercentNumberDecimals) => string,
): string {
  return `± ${formatPercent(priceDeviationPct, 1)}`
}

export function RwaPriceCell({
  priceDisplay,
  convertFiatAmountFormatted,
  formatPercent,
}: {
  priceDisplay: RwaPriceDisplay
  convertFiatAmountFormatted: (value: number, type: FiatNumberType) => string
  formatPercent: (value: number | undefined, maxDecimals?: PercentNumberDecimals) => string
}): JSX.Element {
  if (priceDisplay.kind === 'single') {
    return <TableText>{convertFiatAmountFormatted(priceDisplay.priceUsd, NumberType.FiatTokenPrice)}</TableText>
  }

  return (
    <Flex flexDirection="column" alignItems="flex-end" gap="$spacing2">
      <TableText>{convertFiatAmountFormatted(priceDisplay.priceUsd, NumberType.FiatTokenPrice)}</TableText>
      <Text variant="body3" color="$neutral2">
        {formatRwaPriceDeviationLabel(priceDisplay.priceDeviationPct, formatPercent)}
      </Text>
    </Flex>
  )
}
