import { memo } from 'react'
import { iconSizes } from 'ui/src/theme'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { RwaTokenOption } from 'uniswap/src/components/lists/items/types'
import { TokenSelectorPill } from 'uniswap/src/components/TokenSelector/items/tokens/TokenSelectorPill'
import { OnSelectRwaToken } from 'uniswap/src/components/TokenSelector/types'
import { getSymbolDisplayText } from 'uniswap/src/utils/currency'

function StockPillInner({
  option,
  onPressRwaToken,
  isPending = false,
}: {
  option: RwaTokenOption
  onPressRwaToken: OnSelectRwaToken
  /** True while this pill's tap is waiting on the pre-selection token fetch. */
  isPending?: boolean
}): JSX.Element {
  return (
    <TokenSelectorPill
      isPending={isPending}
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
      label={getSymbolDisplayText(option.symbol)}
      testID={`stock-option-${option.chainId}-${option.symbol}`}
      onPress={(): void => onPressRwaToken(option)}
    />
  )
}

export const StockPill = memo(StockPillInner)
