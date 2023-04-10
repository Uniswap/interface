import { PortfolioBalance } from 'app/src/features/dataApi/types'
import { CurrencyId } from 'app/src/utils/currencyId'
import { formatNumber, NumberType } from 'app/src/utils/format'
import { memo } from 'react'
import { Image } from 'tamagui'
import { Flex } from 'ui/src/components/layout/Flex'
import { Text } from 'ui/src/components/text/Text'
import { iconSize } from 'ui/src/theme/tokens'

interface TokenBalanceItemProps {
  portfolioBalance: PortfolioBalance
  onPressToken?: (currencyId: CurrencyId) => void
  isWarmLoading?: boolean
}

export const TOKEN_BALANCE_ITEM_HEIGHT = 56

export const TokenBalanceItem = memo(
  ({ portfolioBalance, onPressToken }: TokenBalanceItemProps) => {
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
        paddingVertical="spacing8"
        onPress={onPress}>
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
      </Flex>
    )
  }
)
