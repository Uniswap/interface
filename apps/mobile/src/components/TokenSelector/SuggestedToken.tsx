import { ImpactFeedbackStyle } from 'expo-haptics'
import { memo } from 'react'
import { useAppTheme } from 'src/app/hooks'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { Pill } from 'src/components/text/Pill'
import {
  OnSelectCurrency,
  SuggestedTokenSection,
} from 'src/components/TokenSelector/TokenSelectorList'
import { TokenOption } from 'src/components/TokenSelector/types'
import { iconSizes } from 'ui/src/theme/iconSizes'
import { TokenLogo } from 'wallet/src/components/CurrencyLogo/TokenLogo'

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
  const theme = useAppTheme()
  const onPress = (): void => {
    onSelectCurrency?.(currency, section, index)
  }
  return (
    <TouchableArea
      hapticFeedback
      hapticStyle={ImpactFeedbackStyle.Light}
      testID={`token-option-${currency.chainId}-${currency.symbol}`}
      onPress={onPress}>
      <Pill
        backgroundColor="surface3"
        borderRadius="roundedFull"
        foregroundColor={theme.colors.neutral1}
        icon={<TokenLogo size={iconSizes.icon28} symbol={currency.symbol} url={logoUrl} />}
        label={currency.symbol}
        mr="spacing8"
        my="spacing4"
        pl="spacing4"
        pr="spacing12"
        py="spacing4"
        textVariant="bodyLarge"
      />
    </TouchableArea>
  )
}

export const SuggestedToken = memo(_SuggestedToken)
