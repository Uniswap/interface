import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, ImpactFeedbackStyle, Shine, Text, TouchableArea, isWeb } from 'ui/src'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { PortfolioBalance } from 'uniswap/src/features/dataApi/types'
import { CurrencyId } from 'uniswap/src/types/currency'
import { getSymbolDisplayText } from 'uniswap/src/utils/currency'
import { NumberType } from 'utilities/src/format/types'
import { RelativeChange } from 'wallet/src/components/text/RelativeChange'
import { useLocalizationContext } from 'wallet/src/features/language/LocalizationContext'
import { disableOnPress } from 'wallet/src/utils/disableOnPress'

/**
 * IMPORTANT: if you modify the UI of this component, make sure to update the corresponding Skeleton component.
 */

interface TokenBalanceItemProps {
  portfolioBalance: PortfolioBalance
  onPressToken?: (currencyId: CurrencyId) => void
  isLoading?: boolean
  padded?: boolean
  index?: number
}

export const TokenBalanceItem = memo(function _TokenBalanceItem({
  portfolioBalance,
  onPressToken,
  isLoading,
  index,
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
  const balance = convertFiatAmountFormatted(portfolioBalance.balanceUSD, NumberType.FiatTokenQuantity)

  return (
    <TouchableArea
      hapticFeedback
      hoverable
      alignItems="flex-start"
      backgroundColor="$surface1"
      borderRadius="$rounded16"
      flexDirection="row"
      hapticStyle={ImpactFeedbackStyle.Light}
      justifyContent="space-between"
      px={padded ? '$spacing24' : '$spacing8'}
      py="$spacing8"
      testID={`token-list-item-${index ?? 0}`}
      onLongPress={disableOnPress}
      onPress={onPress}
    >
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
