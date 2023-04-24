import { memo } from 'react'
import { Image } from 'tamagui'
import { Flex } from 'ui/src/components/layout/Flex'
import { Text } from 'ui/src/components/text/Text'
import { iconSize } from 'ui/src/theme/tokens'
import { PortfolioBalance } from 'wallet/src/features/dataApi/types'
import { CurrencyId } from 'wallet/src/utils/currencyId'
import { formatNumber, NumberType } from 'wallet/src/utils/format'

interface TokenBalanceItemProps {
  portfolioBalance: PortfolioBalance
  onPressToken?: (currencyId: CurrencyId) => void
  isWarmLoading?: boolean
  loading?: boolean
}

export const TOKEN_BALANCE_ITEM_HEIGHT = 56

export const TokenBalanceItem = memo(
  ({ portfolioBalance, onPressToken, loading }: TokenBalanceItemProps) => {
    const { quantity, currencyInfo, relativeChange24 } = portfolioBalance
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
            overflow="hidden">
            <Image
              height={iconSize.icon36}
              src={currencyInfo.logoUrl ?? ''}
              width={iconSize.icon36}
            />
            <Flex alignItems="flex-start" flexShrink={1} gap="$none">
              <Text ellipsizeMode="tail" numberOfLines={1} variant="bodyLarge">
                {currency.name ?? currency.symbol}
              </Text>
              <Flex
                alignItems="center"
                flexDirection="row"
                gap="$spacing8"
                minHeight={20}>
                <Text
                  color="$textTertiary"
                  numberOfLines={1}
                  variant="subheadSmall">
                  {`${formatNumber(quantity, NumberType.TokenNonTx)}`}{' '}
                  {currency.symbol}
                </Text>
                <Text
                  color={
                    relativeChange24 && relativeChange24 > 0
                      ? '$accentSuccess'
                      : '$accentCritical'
                  }
                  variant="subheadSmall">
                  {relativeChange24
                    ? `${Math.abs(relativeChange24).toFixed(2)}%`
                    : ''}
                </Text>
              </Flex>
            </Flex>
          </Flex>
        )}
      </Flex>
    )
  }
)
