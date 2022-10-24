import React, { memo } from 'react'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { useAppTheme } from 'src/app/hooks'
import { Button } from 'src/components/buttons/Button'
import { TokenLogo } from 'src/components/CurrencyLogo/TokenLogo'
import { AnimatedFlex, Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { RelativeChange } from 'src/components/text/RelativeChange'
import { PortfolioBalance } from 'src/features/dataApi/types'
import { CurrencyId } from 'src/utils/currencyId'
import { formatNumber, formatUSDPrice, NumberType } from 'src/utils/format'

interface TokenBalanceItemProps {
  portfolioBalance: PortfolioBalance
  onPressToken?: (currencyId: CurrencyId) => void
  onPressTokenIn?: (currencyId: CurrencyId) => void
}

export const TokenBalanceItem = memo(
  ({ portfolioBalance, onPressToken, onPressTokenIn }: TokenBalanceItemProps) => {
    const theme = useAppTheme()
    const { quantity, currencyInfo, relativeChange24 } = portfolioBalance
    const { currency } = currencyInfo

    const onPress = () => {
      onPressToken?.(currencyInfo.currencyId)
    }

    const onPressIn = () => {
      onPressTokenIn?.(currencyInfo.currencyId)
    }

    return (
      <Button
        alignItems="flex-start"
        bg="none"
        delayPressIn={150}
        flexDirection="row"
        justifyContent="space-between"
        minHeight={56}
        p="sm"
        onPress={onPress}
        onPressIn={onPressIn}>
        <AnimatedFlex
          row
          alignItems="center"
          entering={FadeIn}
          exiting={FadeOut}
          flexShrink={1}
          gap="sm"
          overflow="hidden">
          <TokenLogo
            chainId={currency.chainId}
            size={theme.imageSizes.lg}
            symbol={currency.symbol}
            url={currencyInfo.logoUrl ?? undefined}
          />
          <Flex alignItems="flex-start" flexShrink={1} gap="none">
            <Text ellipsizeMode="tail" numberOfLines={1} variant="bodyLarge">
              {currency.name ?? currency.symbol}
            </Text>
            <Flex row alignItems="center" gap="xs" minHeight={20}>
              <Text color="textSecondary" numberOfLines={1} variant="subheadSmall">
                {`${formatNumber(quantity, NumberType.TokenNonTx)}`} {currency.symbol}
              </Text>
            </Flex>
          </Flex>
        </AnimatedFlex>
        <AnimatedFlex entering={FadeIn} exiting={FadeOut} justifyContent="space-between">
          <Flex alignItems="flex-end" gap="xxs">
            <Text variant="bodyLarge">
              {formatUSDPrice(portfolioBalance.balanceUSD, NumberType.FiatTokenQuantity)}
            </Text>
            <Text color="textSecondary">
              <RelativeChange change={relativeChange24} variant="subheadSmall" />
            </Text>
          </Flex>
        </AnimatedFlex>
      </Button>
    )
  }
)
