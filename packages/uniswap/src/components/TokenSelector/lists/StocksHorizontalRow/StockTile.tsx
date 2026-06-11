import { memo } from 'react'
import { iconSizes } from 'ui/src/theme'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { RwaTokenOption } from 'uniswap/src/components/lists/items/types'
import { TokenGridTile } from 'uniswap/src/components/TokenSelector/items/tokens/TokenGridTile'
import { OnSelectRwaToken } from 'uniswap/src/components/TokenSelector/types'
import { getSymbolDisplayText } from 'uniswap/src/utils/currency'

function StockTileInner({
  option,
  onSelectRwaToken,
}: {
  option: RwaTokenOption
  onSelectRwaToken: OnSelectRwaToken
}): JSX.Element {
  const label = getSymbolDisplayText(option.symbol)

  return (
    <TokenGridTile
      icon={
        <TokenLogo
          alwaysShowNetworkLogo
          chainId={option.chainId}
          name={option.name}
          size={iconSizes.icon24}
          symbol={option.symbol}
          url={option.logoUrl}
        />
      }
      label={label}
      testID={`stock-option-${option.chainId}-${option.symbol}`}
      // Stock tickers can be long and truncate, so show the full ticker on hover.
      tooltipLabel={label}
      labelNumberOfLines={1}
      onPress={(): void => onSelectRwaToken(option)}
    />
  )
}

export const StockTile = memo(StockTileInner)
