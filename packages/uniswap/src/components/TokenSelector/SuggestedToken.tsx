import { memo } from 'react'
import { ImpactFeedbackStyle, TouchableArea, useMedia, useSporeColors } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { Pill } from 'uniswap/src/components/pill/Pill'
import { OnSelectCurrency, TokenOption, TokenSection } from 'uniswap/src/components/TokenSelector/types'
import { getSymbolDisplayText } from 'uniswap/src/utils/currency'

function _SuggestedToken({
  onSelectCurrency,
  token,
  index,
  section,
}: {
  onSelectCurrency: OnSelectCurrency
  token: TokenOption
  index: number
  section: TokenSection
}): JSX.Element {
  const { currency, logoUrl } = token.currencyInfo
  const colors = useSporeColors()
  const media = useMedia()

  const onPress = (): void => {
    onSelectCurrency?.(token.currencyInfo, section, index)
  }

  return (
    <TouchableArea
      hapticFeedback
      hoverable
      borderRadius="$roundedFull"
      hapticStyle={ImpactFeedbackStyle.Light}
      testID={`token-option-${currency.chainId}-${currency.symbol}`}
      onPress={onPress}
    >
      <Pill
        borderColor="$surface3Solid"
        borderRadius="$roundedFull"
        borderWidth={1}
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

export const SuggestedToken = memo(_SuggestedToken)
