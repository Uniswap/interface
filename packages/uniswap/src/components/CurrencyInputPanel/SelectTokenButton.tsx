import { isMobileWeb, isWebApp } from '@universe/environment'
import { TestIDType } from '@universe/test'
import { TokenSelectButton, type TokenSelectButtonProps } from '@universe/transactions-ui'
import { memo } from 'react'
import { getContrastPassingTextColor } from 'ui/src'
import { getTokenLogoProps } from 'uniswap/src/components/CurrencyLogo/getTokenLogoProps'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { getSymbolDisplayText } from 'uniswap/src/utils/currency'

interface SelectTokenButtonProps {
  onPress?: () => void
  selectedCurrencyInfo?: CurrencyInfo | null
  testID?: TestIDType
  tokenColor?: string
}

/** The selected token, the accent and the chevron rule, shared with the CurrencyInputPanel adapter. */
export function getSelectTokenButtonProps({
  selectedCurrencyInfo,
  tokenColor,
}: Pick<SelectTokenButtonProps, 'selectedCurrencyInfo' | 'tokenColor'>): Pick<
  TokenSelectButtonProps,
  'token' | 'accent' | 'showChevron'
> {
  return {
    token: selectedCurrencyInfo
      ? {
          symbol: getSymbolDisplayText(selectedCurrencyInfo.currency.symbol) ?? '',
          logo: getTokenLogoProps(selectedCurrencyInfo),
        }
      : undefined,
    accent:
      !selectedCurrencyInfo && tokenColor
        ? { color: tokenColor, textColor: getContrastPassingTextColor(tokenColor) }
        : undefined,
    showChevron: isWebApp && !isMobileWeb,
  }
}

export const SelectTokenButton = memo(function SelectTokenButtonInner({
  selectedCurrencyInfo,
  onPress,
  testID,
  tokenColor,
}: SelectTokenButtonProps): JSX.Element {
  return (
    <TokenSelectButton
      {...getSelectTokenButtonProps({ selectedCurrencyInfo, tokenColor })}
      testID={testID}
      onPress={onPress}
    />
  )
})
