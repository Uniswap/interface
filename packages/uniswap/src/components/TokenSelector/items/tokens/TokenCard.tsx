import { memo } from 'react'
import { Flex, Text, TouchableArea } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { OnSelectCurrency, TokenSection } from 'uniswap/src/components/TokenSelector/types'
import { TokenOption } from 'uniswap/src/components/lists/types'
import { getSymbolDisplayText } from 'uniswap/src/utils/currency'

function _TokenCard({
  onSelectCurrency,
  token,
  index,
  section,
}: {
  onSelectCurrency: OnSelectCurrency
  token: TokenOption
  index: number
  section: TokenSection<TokenOption[]>
}): JSX.Element {
  const { currency, logoUrl } = token.currencyInfo

  const onPress = (): void => {
    onSelectCurrency?.(token.currencyInfo, section, index)
  }

  const tokenLabel = getSymbolDisplayText(currency.symbol)

  return (
    <TouchableArea
      hoverable
      borderRadius="$roundedFull"
      testID={`token-option-${currency.chainId}-${currency.symbol}`}
      onPress={onPress}
    >
      <Flex centered backgroundColor="$surface2" borderRadius="$rounded16" px="$spacing16" py="$spacing12" gap="$gap4">
        <TokenLogo
          chainId={currency.chainId}
          name={currency.name}
          size={iconSizes.icon24}
          symbol={currency.symbol}
          url={logoUrl}
        />
        <Text color="$neutral1" variant="buttonLabel3">
          {tokenLabel}
        </Text>
      </Flex>
    </TouchableArea>
  )
}

export const TokenCard = memo(_TokenCard)
