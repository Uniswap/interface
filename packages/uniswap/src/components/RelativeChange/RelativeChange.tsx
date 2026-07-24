import { ColorTokens, Flex, Text } from 'ui/src'
import { Caret } from 'ui/src/components/icons/Caret'
import { type FontVariantToken, fonts, IconSizeTokens } from 'ui/src/theme'
import AnimatedNumber from 'uniswap/src/components/AnimatedNumber/AnimatedNumber'
import { useAppFiatCurrencyInfo } from 'uniswap/src/features/fiatCurrency/hooks'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { getDeltaTextColor } from 'uniswap/src/utils/getDeltaTextColor'
import { NumberType } from 'utilities/src/format/types'

interface RelativeChangeProps {
  change?: number
  absoluteChange?: number
  variant?: keyof typeof fonts
  semanticColor?: boolean // If true, entire % change text will render green or red
  positiveChangeColor?: ColorTokens
  negativeChangeColor?: ColorTokens
  color?: ColorTokens
  arrowSize?: IconSizeTokens
  loading?: boolean
  alignRight?: boolean
  shouldAnimate?: boolean
}

export function RelativeChange(props: RelativeChangeProps): JSX.Element {
  const {
    absoluteChange,
    change,
    variant = 'subheading2',
    semanticColor,
    positiveChangeColor = '$statusSuccess',
    negativeChangeColor = '$statusCritical',
    arrowSize = '$icon.16',
    loading = false,
    alignRight = false,
    color = '$neutral2',
    shouldAnimate = false,
  } = props
  const { formatNumberOrString, formatPercent } = useLocalizationContext()
  const currency = useAppFiatCurrencyInfo()

  // `||`, not `??`: when `change` rounds to exactly 0 but `absoluteChange` hasn't, fall back to it —
  // AnimatedNumber's native change-detection gates its whole animation trigger on this value being
  // truthy, so a literal 0 here would silently skip animating the dollar amount when it updates.
  const directionValue = change || absoluteChange
  const isPositiveChange = directionValue !== undefined ? directionValue >= 0 : undefined
  const arrowColor = isPositiveChange ? positiveChangeColor : negativeChangeColor
  const textColor = semanticColor ? getDeltaTextColor(directionValue) : color

  const formattedChange = formatPercent(change !== undefined ? Math.abs(change) : change)
  const formattedAbsChange = absoluteChange
    ? `${formatNumberOrString({
        value: Math.abs(absoluteChange),
        type: NumberType.PortfolioBalance,
        currencyCode: currency.code,
      })}`
    : ''

  // `absoluteChange` and `change` can each be shown alone or combined as `absChange (change%)`.
  const combinedFormatted = absoluteChange
    ? change !== undefined
      ? `${formattedAbsChange} (${formattedChange})`
      : formattedAbsChange
    : formattedChange

  return (
    <Flex
      row
      alignItems="center"
      gap="$spacing2"
      justifyContent={alignRight ? 'flex-end' : 'flex-start'}
      testID="relative-change"
    >
      {directionValue !== undefined && (
        <Caret color={arrowColor} direction={isPositiveChange ? 'n' : 's'} size={arrowSize} />
      )}
      <Flex>
        {shouldAnimate && directionValue !== undefined ? (
          <AnimatedNumber
            alignRight={alignRight}
            color={textColor}
            containerTestID={TestID.PortfolioRelativeChange}
            loading={loading}
            loadingPlaceholderText="▲ 00.00 (0.00)%"
            numericValue={directionValue}
            textVariant={`$${variant}` as FontVariantToken}
            value={combinedFormatted}
          />
        ) : (
          <Text
            color={textColor}
            loading={loading}
            loadingPlaceholderText="▲ 00.00 (0.00)%"
            testID={TestID.PortfolioRelativeChange}
            variant={variant}
          >
            {combinedFormatted}
          </Text>
        )}
      </Flex>
    </Flex>
  )
}
