import { Flex, Text, TouchableArea } from '@universe/mycelium'
import { TestID } from '@universe/test'
import type { ComponentProps } from 'react'
import { useTranslation } from 'react-i18next'
import { DropdownButton, Shine } from 'ui/src'
import { X } from 'ui/src/components/icons/X'
import { iconSizes } from 'ui/src/theme'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'

export const CurrencySelector = ({
  loading,
  currencyInfo,
  onPress,
  onClear,
  placeholder,
  emphasis = 'primary',
  index,
  fill,
  chevronColor,
  chevronSize,
}: {
  loading?: boolean
  currencyInfo: Maybe<CurrencyInfo>
  onPress: () => void
  // When provided and a currency is selected, the selector renders a clearable chip with an "x" button.
  onClear?: () => void
  placeholder?: string
  emphasis?: 'primary' | 'tertiary'
  // When multiple clearable selectors render together, pass a unique index so each "x" button gets a distinct testID.
  index?: number
  /**
   * Defaults to the button's own `fill` (stretch to the parent). Pass false where the selectors sit in a
   * plain row: filling makes each `flex: 1 basis-0`, which splits the row's content width evenly and
   * clips the label of whichever placeholder is wider (e.g. "Token 2" vs "Token 1").
   */
  fill?: boolean
  /**
   * Chevron overrides, forwarded to the button. Supplied by the caller rather than inferred from
   * `emphasis` so a surface opts into the treatment explicitly: left unset the chevron uses the
   * emphasis colour at the glyph's own 24px default.
   */
  chevronColor?: ComponentProps<typeof DropdownButton>['chevronColor']
  chevronSize?: ComponentProps<typeof DropdownButton>['chevronSize']
}) => {
  const { t } = useTranslation()
  const currency = currencyInfo?.currency
  const emptyTextColor = emphasis === 'tertiary' ? '$neutral2' : '$surface1'
  // A selected currency drops to the frame's own default emphasis (its logo carries the button).
  const resolvedEmphasis = currencyInfo ? undefined : emphasis

  if (loading) {
    return (
      <Shine width="100%">
        <Flex backgroundColor="$surface3" borderRadius="$rounded16" height={50} />
      </Shine>
    )
  }

  if (currency && onClear) {
    return (
      <Flex
        row
        alignItems="center"
        gap="$gap8"
        backgroundColor="$surface3"
        borderRadius="$roundedFull"
        pl="$spacing12"
        pr="$spacing6"
        py="$spacing8"
      >
        <TouchableArea row alignItems="center" gap="$gap8" onPress={onPress}>
          <TokenLogo
            size={iconSizes.icon24}
            chainId={currency.chainId}
            name={currency.name}
            symbol={currency.symbol}
            url={currencyInfo.logoUrl}
          />
          <Text variant="buttonLabel2" color="$neutral1">
            {currency.symbol}
          </Text>
        </TouchableArea>
        <TouchableArea
          alignItems="center"
          justifyContent="center"
          borderRadius="$roundedFull"
          p="$spacing4"
          backgroundColor="$surface3Hovered"
          hoverStyle={{ backgroundColor: '$surface2' }}
          onPress={onClear}
          testID={index === undefined ? TestID.ClearLiquidityToken : `${TestID.ClearLiquidityToken}-${index}`}
        >
          <X size="$icon.16" color="$neutral2" hoverColor="$neutral1" />
        </TouchableArea>
      </Flex>
    )
  }

  return (
    <DropdownButton
      emphasis={resolvedEmphasis}
      chevronColor={chevronColor}
      chevronSize={chevronSize}
      fill={fill}
      onPress={onPress}
      elementPositioning="grouped"
      isExpanded={false}
      icon={
        currency ? (
          <TokenLogo
            size={iconSizes.icon24}
            chainId={currency.chainId}
            name={currency.name}
            symbol={currency.symbol}
            url={currencyInfo.logoUrl}
          />
        ) : undefined
      }
    >
      <DropdownButton.Text color={currency ? '$neutral1' : emptyTextColor}>
        {currency ? currency.symbol : (placeholder ?? t('fiatOnRamp.button.chooseToken'))}
      </DropdownButton.Text>
    </DropdownButton>
  )
}
