import { memo } from 'react'
import { iconSizes } from 'ui/src/theme'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { TokenOption } from 'uniswap/src/components/lists/items/types'
import type { OnchainItemSection } from 'uniswap/src/components/lists/OnchainItemList/types'
import { TokenSelectorPill } from 'uniswap/src/components/TokenSelector/items/tokens/TokenSelectorPill'
import { OnSelectCurrency } from 'uniswap/src/components/TokenSelector/types'
import { getSymbolDisplayText } from 'uniswap/src/utils/currency'

function TokenPillInner({
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

  return (
    <TokenSelectorPill
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
      testID={`token-option-${currency.chainId}-${currency.symbol}`}
      onPress={(): void => onSelectCurrency(token.currencyInfo, section, index)}
    />
  )
}

export const TokenPill = memo(TokenPillInner)
