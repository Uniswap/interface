import { useTranslation } from 'react-i18next'
import { DropdownButton, Flex, Shine, Text, TouchableArea } from 'ui/src'
import { X } from 'ui/src/components/icons/X'
import { iconSizes } from 'ui/src/theme'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

export const CurrencySelector = ({
  loading,
  currencyInfo,
  onPress,
  onClear,
  placeholder,
  emphasis = 'primary',
  index,
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
}) => {
  const { t } = useTranslation()
  const currency = currencyInfo?.currency
  const emptyTextColor = emphasis === 'tertiary' ? '$neutral2' : '$surface1'

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
      emphasis={currencyInfo ? undefined : emphasis}
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
