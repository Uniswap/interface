import { Flex, Text } from '@universe/mycelium'
import { Trans } from 'ui/src'
import { RelativeChange } from 'uniswap/src/components/RelativeChange/RelativeChange'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { LowPriceConfidenceIcon } from 'uniswap/src/features/prices/LowPriceConfidenceIcon'
import { NumberType } from 'utilities/src/format/types'

/** `isPriceFloor`: a grouped RWA row whose price is the lowest across its issuers, shown as "from $X". */
export function TokenOptionItemStats({
  priceUsd,
  pricePercentChange1d,
  isPriceFloor = false,
  isLowPriceConfidence = false,
}: {
  priceUsd: number
  pricePercentChange1d?: number
  isPriceFloor?: boolean
  isLowPriceConfidence?: boolean
}): JSX.Element {
  const { convertFiatAmountFormatted } = useLocalizationContext()
  const price = convertFiatAmountFormatted(priceUsd, NumberType.FiatTokenPrice)

  return (
    <Flex alignItems="flex-end">
      <Flex row alignItems="center" gap="$spacing4">
        {isLowPriceConfidence && <LowPriceConfidenceIcon />}
        {isPriceFloor ? (
          <Text variant="body1" color="$neutral3" numberOfLines={1}>
            <Trans
              i18nKey="search.results.stats.fromPrice"
              values={{ price }}
              components={{ price: <Text variant="body1" color="$neutral1" /> }}
            />
          </Text>
        ) : (
          <Text variant="body1" color="$neutral1">
            {price}
          </Text>
        )}
      </Flex>
      {pricePercentChange1d != null && (
        <RelativeChange alignRight semanticColor change={pricePercentChange1d} arrowSize="$icon.12" variant="body3" />
      )}
    </Flex>
  )
}
