import { Flex, Text } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { RelativeChange } from 'uniswap/src/components/RelativeChange/RelativeChange'
import {
  TOKEN_CARD_SPARKLINE_HEIGHT_HORIZONTAL,
  TOKEN_CARD_SPARKLINE_WIDTH,
} from 'uniswap/src/components/TokenCard/constants'
import { TokenCardSparkline } from 'uniswap/src/components/TokenCard/TokenCardSparkline'
import type { TokenCardHorizontalProps } from 'uniswap/src/components/TokenCard/types'

export function TokenCardHorizontal({
  logoUrl,
  name,
  symbol,
  pricePercentChange1d,
  sparkline,
  hideNetworkLogo,
}: TokenCardHorizontalProps): JSX.Element {
  return (
    <>
      <TokenLogo hideNetworkLogo={hideNetworkLogo} name={name} size={iconSizes.icon32} symbol={symbol} url={logoUrl} />
      <Flex fill minWidth={0}>
        <Text color="$neutral1" numberOfLines={1} variant="body2">
          {name}
        </Text>
        <Flex row alignItems="center" gap="$spacing8">
          {symbol !== undefined && (
            <Text color="$neutral2" numberOfLines={1} variant="body3">
              {symbol}
            </Text>
          )}
          {pricePercentChange1d !== undefined && (
            <RelativeChange arrowSize="$icon.12" change={pricePercentChange1d} variant="body3" />
          )}
        </Flex>
      </Flex>
      <TokenCardSparkline
        data={sparkline}
        height={TOKEN_CARD_SPARKLINE_HEIGHT_HORIZONTAL}
        isNegative={(pricePercentChange1d ?? 0) < 0}
        width={TOKEN_CARD_SPARKLINE_WIDTH}
      />
    </>
  )
}
