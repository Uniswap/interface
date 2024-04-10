import { ImpactFeedbackStyle } from 'expo-haptics'
import { memo } from 'react'
import { isWeb, TouchableArea, useSporeColors } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { TokenLogo } from 'wallet/src/components/CurrencyLogo/TokenLogo'
import { Pill } from 'wallet/src/components/text/Pill'
import {
  OnSelectCurrency,
  SuggestedTokenSection,
  TokenOption,
} from 'wallet/src/components/TokenSelector/types'
import { getSymbolDisplayText } from 'wallet/src/utils/currency'

function _SuggestedToken({
  onSelectCurrency,
  token,
  index,
  section,
}: {
  onSelectCurrency: OnSelectCurrency
  token: TokenOption
  index: number
  section: SuggestedTokenSection
}): JSX.Element {
  const { currency, logoUrl } = token.currencyInfo
  const colors = useSporeColors()
  const onPress = (): void => {
    onSelectCurrency?.(token.currencyInfo, section, index)
  }
  return (
    <TouchableArea
      hapticFeedback
      hapticStyle={ImpactFeedbackStyle.Light}
      testID={`token-option-${currency.chainId}-${currency.symbol}`}
      onPress={onPress}>
      <Pill
        backgroundColor="$surface3"
        borderRadius="$roundedFull"
        foregroundColor={colors.neutral1.val}
        icon={
          <TokenLogo
            name={currency.name}
            size={isWeb ? iconSizes.icon24 : iconSizes.icon28}
            symbol={currency.symbol}
            url={logoUrl}
          />
        }
        label={getSymbolDisplayText(currency.symbol)}
        mr="$spacing8"
        my="$spacing4"
        pl="$spacing4"
        pr="$spacing12"
        py="$spacing4"
        textVariant={isWeb ? 'buttonLabel3' : 'body1'}
      />
    </TouchableArea>
  )
}

export const SuggestedToken = memo(_SuggestedToken)
