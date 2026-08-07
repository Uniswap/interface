import { Flex, Text } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { RelativeChange } from 'uniswap/src/components/RelativeChange/RelativeChange'
import {
  TOKEN_CARD_SPARKLINE_HEIGHT_VERTICAL,
  TOKEN_CARD_SPARKLINE_WIDTH,
} from 'uniswap/src/components/TokenCard/constants'
import { TokenCardSparkline } from 'uniswap/src/components/TokenCard/TokenCardSparkline'
import type { TokenCardVerticalProps } from 'uniswap/src/components/TokenCard/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'

export function TokenCardVertical({
  logoUrl,
  name,
  symbol,
  issuerLabel,
  priceUsd,
  pricePercentChange1d,
  sparkline,
  hideNetworkLogo,
}: TokenCardVerticalProps): JSX.Element {
  const { convertFiatAmountFormatted } = useLocalizationContext()
  const priceLabel =
    priceUsd !== undefined ? convertFiatAmountFormatted(priceUsd, NumberType.FiatTokenPrice) : undefined

  return (
    <>
      <Flex row alignItems="center" justifyContent="space-between" width="100%">
        <TokenLogo
          hideNetworkLogo={hideNetworkLogo}
          name={name}
          size={iconSizes.icon32}
          symbol={symbol}
          url={logoUrl}
        />
        <TokenCardSparkline
          data={sparkline}
          height={TOKEN_CARD_SPARKLINE_HEIGHT_VERTICAL}
          isNegative={(pricePercentChange1d ?? 0) < 0}
          width={TOKEN_CARD_SPARKLINE_WIDTH}
        />
      </Flex>
      <Flex gap="$spacing2" width="100%">
        <Flex row alignItems="baseline" gap="$spacing8">
          <Text color="$neutral1" flexShrink={1} numberOfLines={1} variant="body2">
            {name}
          </Text>
          {issuerLabel !== undefined && (
            <Text color="$neutral3" numberOfLines={1} variant="body4">
              {issuerLabel}
            </Text>
          )}
        </Flex>
        <Flex row alignItems="center" gap="$spacing4">
          {priceLabel !== undefined && (
            <Text color="$neutral1" numberOfLines={1} variant="body3">
              {priceLabel}
            </Text>
          )}
          {pricePercentChange1d !== undefined && (
            <RelativeChange arrowSize="$icon.12" change={pricePercentChange1d} variant="body3" />
          )}
        </Flex>
      </Flex>
    </>
  )
}
