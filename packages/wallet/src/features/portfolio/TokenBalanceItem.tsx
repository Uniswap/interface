import { ImpactFeedbackStyle } from 'expo-haptics'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Shine, Text, TouchableArea, isWeb } from 'ui/src'
import { NumberType } from 'utilities/src/format/types'
import { TokenLogo } from 'wallet/src/components/CurrencyLogo/TokenLogo'
import { RelativeChange } from 'wallet/src/components/text/RelativeChange'
import { PortfolioBalance } from 'wallet/src/features/dataApi/types'
import { useLocalizationContext } from 'wallet/src/features/language/LocalizationContext'
import { getSymbolDisplayText } from 'wallet/src/utils/currency'
import { CurrencyId } from 'wallet/src/utils/currencyId'
import { disableOnPress } from 'wallet/src/utils/disableOnPress'

interface TokenBalanceItemProps {
  portfolioBalance: PortfolioBalance
  onPressToken?: (currencyId: CurrencyId) => void
  isLoading?: boolean
  padded?: boolean
}

export const TOKEN_BALANCE_ITEM_HEIGHT = 56

export const TokenBalanceItem = memo(function _TokenBalanceItem({
  portfolioBalance,
  onPressToken,
  isLoading,
  padded,
}: TokenBalanceItemProps) {
  const { quantity, currencyInfo, relativeChange24 } = portfolioBalance
  const { currency } = currencyInfo
  const { t } = useTranslation()
  const { convertFiatAmountFormatted, formatNumberOrString } = useLocalizationContext()

  const onPress = (): void => {
    onPressToken?.(currencyInfo.currencyId)
  }

  const shortenedSymbol = getSymbolDisplayText(currency.symbol)
  const balance = convertFiatAmountFormatted(
    portfolioBalance.balanceUSD,
    NumberType.FiatTokenQuantity
  )

  return (
    <TouchableArea
      hapticFeedback
      alignItems="flex-start"
      backgroundColor="$surface1"
      borderRadius="$rounded16"
      flexDirection="row"
      hapticStyle={ImpactFeedbackStyle.Light}
      justifyContent="space-between"
      minHeight={TOKEN_BALANCE_ITEM_HEIGHT}
      px={padded ? '$spacing24' : 0}
      py="$spacing8"
      onLongPress={disableOnPress}
      onPress={onPress}>
      <Flex row shrink alignItems="center" gap="$spacing12" overflow="hidden">
        <TokenLogo
          chainId={currency.chainId}
          name={currency.name}
          symbol={currency.symbol}
          url={currencyInfo.logoUrl ?? undefined}
        />
        <Flex shrink alignItems="flex-start">
          <Text ellipsizeMode="tail" numberOfLines={1} variant={isWeb ? 'body2' : 'body1'}>
            {currency.name ?? shortenedSymbol}
          </Text>
          <Flex row alignItems="center" gap="$spacing8" minHeight={20}>
            <Text color="$neutral2" numberOfLines={1} variant={isWeb ? 'body3' : 'body2'}>
              {`${formatNumberOrString({ value: quantity })}`} {shortenedSymbol}
            </Text>
          </Flex>
        </Flex>
      </Flex>
      <Flex justifyContent="space-between" position="relative">
        <Shine disabled={!isLoading}>
          {!portfolioBalance.balanceUSD ? (
            <Flex centered fill>
              <Text color="$neutral2">{t('common.text.notAvailable')}</Text>
            </Flex>
          ) : (
            <Flex alignItems="flex-end" pl="$spacing8">
              <Text color="$neutral1" numberOfLines={1} variant={isWeb ? 'body2' : 'body1'}>
                {balance}
              </Text>
              <RelativeChange
                alignRight
                change={relativeChange24 ?? undefined}
                negativeChangeColor="$statusCritical"
                positiveChangeColor="$statusSuccess"
                variant={isWeb ? 'body3' : 'body2'}
              />
            </Flex>
          )}
        </Shine>
      </Flex>
    </TouchableArea>
  )
})
