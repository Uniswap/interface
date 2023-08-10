import { memo } from 'react'
import { Image, Stack, YStack } from 'ui/src'
import { Flex } from 'ui/src/components/layout/Flex'
import { Text } from 'ui/src/components/text/Text'
import { iconSizes } from 'ui/src/theme/iconSizes'
import { formatNumber, formatUSDPrice, NumberType } from 'utilities/src/format/format'
import { PortfolioBalance } from 'wallet/src/features/dataApi/types'
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
  const { quantity, currencyInfo } = portfolioBalance
  const { currency } = currencyInfo

  const onPress = (): void => {
    onPressToken?.(currencyInfo.currencyId)
  }

  return (
    <Flex
      row
      alignItems="flex-start"
      justifyContent="space-between"
      minHeight={TOKEN_BALANCE_ITEM_HEIGHT}
      paddingHorizontal="$spacing16"
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
          <Image
            height={iconSizes.icon36}
            src={currencyInfo.logoUrl ?? ''}
            width={iconSizes.icon36}
          />

          {/* Currency name */}
          <Stack flex={1.5} flexBasis={0}>
            <Text ellipsizeMode="tail" numberOfLines={1} variant="bodyLarge">
              {currency.name ?? currency.symbol}
            </Text>
          </Stack>

          {/* Portfolio balance */}
          <YStack alignItems="flex-end" flex={1} justifyContent="flex-end" width={0}>
            <Text ellipsizeMode="tail" numberOfLines={1} variant="bodyLarge">
              {portfolioBalance.balanceUSD === 0
                ? 'N/A'
                : formatUSDPrice(portfolioBalance.balanceUSD, NumberType.FiatTokenQuantity)}
            </Text>
            <Flex maxWidth={100}>
              <Text color="$neutral3" numberOfLines={1} variant="subheadSmall">
                {`${formatNumber(quantity, NumberType.TokenNonTx)}`} {currency.symbol}
              </Text>
            </Flex>
          </YStack>
        </Flex>
      )}
    </Flex>
  )
})
