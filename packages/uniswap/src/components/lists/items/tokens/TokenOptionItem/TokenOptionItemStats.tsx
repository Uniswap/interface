import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { Flex, Text } from '@universe/mycelium'
import { Trans } from 'react-i18next'
import { RelativeChange } from 'uniswap/src/components/RelativeChange/RelativeChange'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'

/** `isPriceFloor`: a grouped RWA row whose price is the lowest across its issuers, shown as "from $X". */
export function TokenOptionItemStats({
  priceUsd,
  pricePercentChange1d,
  isPriceFloor = false,
}: {
  priceUsd: number
  pricePercentChange1d?: number
  isPriceFloor?: boolean
}): JSX.Element {
  const { convertFiatAmountFormatted } = useLocalizationContext()
  const price = convertFiatAmountFormatted(priceUsd, NumberType.FiatTokenPrice)
  const priceVariant = useFeatureFlag(FeatureFlags.SearchV2UI) ? 'body1' : 'body2'

  return (
    <Flex alignItems="flex-end">
      {isPriceFloor ? (
        <Text variant={priceVariant} color="$neutral3" numberOfLines={1}>
          <Trans
            i18nKey="search.results.stats.fromPrice"
            values={{ price }}
            components={{ price: <Text variant={priceVariant} color="$neutral1" /> }}
          />
        </Text>
      ) : (
        <Text variant={priceVariant} color="$neutral1">
          {price}
        </Text>
      )}
      {pricePercentChange1d != null && (
        <RelativeChange alignRight semanticColor change={pricePercentChange1d} arrowSize="$icon.12" variant="body3" />
      )}
    </Flex>
  )
}
