import { ImpactFeedbackStyle } from 'expo-haptics'
import { memo } from 'react'
import { StyleSheet } from 'react-native'
import { useAppTheme } from 'src/app/hooks'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { TokenLogo } from 'src/components/CurrencyLogo/TokenLogo'
import { Pill } from 'src/components/text/Pill'
import {
  OnSelectCurrency,
  SuggestedTokenSection,
} from 'src/components/TokenSelector/TokenSelectorList'
import { TokenOption } from 'src/components/TokenSelector/types'
import { iconSizes } from 'ui/src/theme/iconSizes'

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
        backgroundColor="background2"
        borderRadius="rounded16"
        foregroundColor={theme.colors.textPrimary}
        icon={<TokenLogo size={iconSizes.icon20} symbol={currency.symbol} url={logoUrl} />}
        label={currency.symbol}
        mr="spacing8"
        my="spacing4"
        py="spacing12"
        style={styles.pill}
        textVariant="bodyLarge"
      />
    </TouchableArea>
  )
}

const styles = StyleSheet.create({
  pill: {
    // neither 12 nor 16 looks good
    paddingHorizontal: 14,
  },
})

export const SuggestedToken = memo(_SuggestedToken)
