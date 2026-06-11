import { memo } from 'react'
import { iconSizes } from 'ui/src/theme'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { TokenOption } from 'uniswap/src/components/lists/items/types'
import { OnchainItemSection, OnchainItemSectionName } from 'uniswap/src/components/lists/OnchainItemList/types'
import { TokenGridTile } from 'uniswap/src/components/TokenSelector/items/tokens/TokenGridTile'
import { OnSelectCurrency } from 'uniswap/src/components/TokenSelector/types'
import { getChainLabel } from 'uniswap/src/features/chains/utils'
import { getSymbolDisplayText } from 'uniswap/src/utils/currency'

function TokenCardInner({
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
  const isBridgingToken = section.sectionKey === OnchainItemSectionName.BridgingTokens

  return (
    <TokenGridTile
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
      // Bridgeable assets show their chain name on hover.
      tooltipLabel={isBridgingToken ? getChainLabel(currency.chainId) : undefined}
      onPress={(): void => onSelectCurrency(token.currencyInfo, section, index)}
    />
  )
}

export const TokenCard = memo(TokenCardInner)
