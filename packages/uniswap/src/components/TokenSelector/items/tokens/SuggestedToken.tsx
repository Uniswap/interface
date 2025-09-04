import { memo } from 'react'
import { TouchableArea, useMedia, useSporeColors } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { TokenOption } from 'uniswap/src/components/lists/items/types'
import type { OnchainItemSection } from 'uniswap/src/components/lists/OnchainItemList/types'
import { Pill } from 'uniswap/src/components/pill/Pill'
import { OnSelectCurrency } from 'uniswap/src/components/TokenSelector/types'
import { getSymbolDisplayText } from 'uniswap/src/utils/currency'

function _TokenPill({
  onSelectCurrency,
  token,
  index,
  section,
}: {
  onSelectCurrency: OnSelectCurrency
  token: TokenOption
  index: number
  section: OnchainItemSection<TokenOption[]>
}): JSX.Element {
  const { currency, logoUrl } = token.currencyInfo
  const colors = useSporeColors()
  const media = useMedia()

  const onPress = (): void => {
    onSelectCurrency(token.currencyInfo, section, index)
  }

  return (
    <TouchableArea
      hoverable
      borderRadius="$roundedFull"
      testID={`token-option-${currency.chainId}-${currency.symbol}`}
      onPress={onPress}
    >
      <Pill
        borderColor="$surface3Solid"
        borderRadius="$roundedFull"
        borderWidth="$spacing1"
        foregroundColor={colors.neutral1.val}
        icon={
          <TokenLogo
            chainId={currency.chainId}
            name={currency.name}
            size={iconSizes.icon24}
            symbol={currency.symbol}
            url={logoUrl}
          />
        }
        label={getSymbolDisplayText(currency.symbol)}
        pl="$spacing4"
        pr="$spacing12"
        py="$spacing4"
        textVariant={media.xxs ? 'buttonLabel2' : 'buttonLabel1'}
      />
    </TouchableArea>
  )
}

export const TokenPill = memo(_TokenPill)
