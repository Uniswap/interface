import { memo } from 'react'
import { Image, XStack, YStack } from 'ui/src'
import { Flex } from 'ui/src/components/layout/Flex'
import { Text } from 'ui/src/components/text/Text'
import { iconSizes } from 'ui/src/theme/iconSizes'
import { PortfolioBalance } from 'wallet/src/features/dataApi/types'
import { CurrencyId } from 'wallet/src/utils/currencyId'
import { formatNumber, formatUSDPrice, NumberType } from 'wallet/src/utils/format'

interface TokenBalanceItemProps {
  portfolioBalance: PortfolioBalance
  onPressToken?: (currencyId: CurrencyId) => void
  isWarmLoading?: boolean
  loading?: boolean
}

export const TOKEN_BALANCE_ITEM_HEIGHT = 56

export const TokenBalanceItem = memo(
  ({ portfolioBalance, onPressToken, loading }: TokenBalanceItemProps) => {
    const { quantity, currencyInfo, balanceUSD } = portfolioBalance
    const { currency } = currencyInfo

    const onPress = (): void => {
      onPressToken?.(currencyInfo.currencyId)
    }

    return (
      <Flex
        alignItems="flex-start"
        flexDirection="row"
        justifyContent="space-between"
        minHeight={TOKEN_BALANCE_ITEM_HEIGHT}
        paddingHorizontal="$spacing16"
        paddingVertical="$spacing8"
        width="100%"
        onPress={onPress}>
        {loading ? (
          <Flex
            backgroundColor="$textTertiary"
            borderRadius="$rounded16"
            paddingHorizontal="$spacing16"
            paddingVertical="$spacing12"
            width="100%"
          />
        ) : (
          <Flex
            alignItems="center"
            flexDirection="row"
            flexShrink={1}
            gap="$spacing12"
            overflow="hidden"
            width="100%">
            <Image
              height={iconSizes.icon36}
              src={currencyInfo.logoUrl ?? ''}
              width={iconSizes.icon36}
            />
            <XStack alignItems="center" flexGrow={1} gap="$none" justifyContent="space-between">
              <Text ellipsizeMode="tail" numberOfLines={1} variant="bodyLarge">
                {currency.symbol}
              </Text>
              <YStack alignItems="flex-end" flexGrow={1} justifyContent="flex-end">
                <Text ellipsizeMode="tail" numberOfLines={1} variant="bodyLarge">
                  {formatUSDPrice(balanceUSD)}
                </Text>
                <Text color="$textTertiary" numberOfLines={1} variant="subheadSmall">
                  {`${formatNumber(quantity, NumberType.TokenNonTx)}`} {currency.symbol}
                </Text>
              </YStack>
            </XStack>
          </Flex>
        )}
      </Flex>
    )
  }
)
