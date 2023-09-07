import { memo } from 'react'
import { Flex, getTokenValue, Icons, Text, XStack, YStack } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { theme } from 'ui/src/theme/restyle'
import { formatNumber, formatUSDPrice, NumberType } from 'utilities/src/format/format'
import { PortfolioBalance } from 'wallet/src/features/dataApi/types'
import { RemoteImage } from 'wallet/src/features/images/RemoteImage'
import { getSymbolDisplayText } from 'wallet/src/utils/currency'
import { CurrencyId } from 'wallet/src/utils/currencyId'

interface TokenBalanceItemProps {
  portfolioBalance: PortfolioBalance
  onPressToken?: (currencyId: CurrencyId) => void
  isWarmLoading?: boolean
  loading?: boolean
}

export const TOKEN_BALANCE_ITEM_HEIGHT = 56

export const TokenBalanceItem = memo(function _TokenBalanceItem({
  portfolioBalance,
  onPressToken,
  loading,
}: TokenBalanceItemProps) {
  const { quantity, relativeChange24, balanceUSD, currencyInfo } = portfolioBalance
  const { currency } = currencyInfo

  const onPress = (): void => {
    onPressToken?.(currencyInfo.currencyId)
  }

  // TODO (EXT-297): encapsulate to share better
  const change = relativeChange24 ?? 0

  const isPositiveChange = change !== undefined ? change >= 0 : undefined
  const arrowColor = isPositiveChange ? theme.colors.statusSuccess : theme.colors.statusCritical

  const formattedChange = change !== undefined ? `${Math.abs(change).toFixed(2)}%` : '-'

  return (
    <Flex
      row
      alignItems="flex-start"
      justifyContent="space-between"
      minHeight={TOKEN_BALANCE_ITEM_HEIGHT}
      paddingVertical="$spacing8"
      width="100%"
      onPress={onPress}>
      {loading ? (
        <Flex
          backgroundColor="$neutral3"
          borderRadius="$rounded16"
          paddingHorizontal="$spacing16"
          paddingVertical="$spacing12"
        />
      ) : (
        <Flex row alignItems="center" gap="$spacing12" width="100%">
          {/* Currency logo */}
          <RemoteImage
            height={iconSizes.icon40}
            uri={currencyInfo.logoUrl ?? ''}
            width={iconSizes.icon40}
          />

          {/* Currency name */}
          <YStack flex={1.5} flexBasis={0}>
            <Text ellipsizeMode="tail" numberOfLines={1} variant="bodyLarge">
              {currency.name ?? getSymbolDisplayText(currency.symbol)}
            </Text>
            <Text color="$neutral2" numberOfLines={1} variant="bodyLarge">
              {`${formatNumber(quantity, NumberType.TokenNonTx)}`}{' '}
              {getSymbolDisplayText(currency.symbol)}
            </Text>
          </YStack>

          {/* Portfolio balance */}
          <YStack alignItems="flex-end" flex={1} justifyContent="flex-end" width={0}>
            <Text ellipsizeMode="tail" numberOfLines={1} variant="bodyLarge">
              {balanceUSD === 0 ? 'N/A' : formatUSDPrice(balanceUSD, NumberType.FiatTokenQuantity)}
            </Text>
            <XStack alignItems="center" gap="$spacing4">
              <Icons.ArrowChange
                color={arrowColor}
                rotation={isPositiveChange ? 180 : 0}
                size={getTokenValue('$icon.20')}
              />
              <Text color="$neutral2" numberOfLines={1} variant="bodyLarge">
                {formattedChange}
              </Text>
            </XStack>
            <Flex maxWidth={100} />
          </YStack>
        </Flex>
      )}
    </Flex>
  )
})
