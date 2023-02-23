import { ImpactFeedbackStyle } from 'expo-haptics'
import React, { memo } from 'react'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { TokenLogo } from 'src/components/CurrencyLogo/TokenLogo'
import { AnimatedFlex, Flex } from 'src/components/layout'
import { WarmLoadingShimmer } from 'src/components/loading/WarmLoadingShimmer'
import { Text } from 'src/components/Text'
import { RelativeChange } from 'src/components/text/RelativeChange'
import { PortfolioBalance } from 'src/features/dataApi/types'
import { CurrencyId } from 'src/utils/currencyId'
import { formatNumber, formatUSDPrice, NumberType } from 'src/utils/format'

interface TokenBalanceItemProps {
  portfolioBalance: PortfolioBalance
  onPressToken?: (currencyId: CurrencyId, tokenName?: string) => void
  isWarmLoading?: boolean
}

export const TOKEN_BALANCE_ITEM_HEIGHT = 56

export const TokenBalanceItem = memo(
  ({ portfolioBalance, onPressToken, isWarmLoading }: TokenBalanceItemProps) => {
    const { quantity, currencyInfo, relativeChange24 } = portfolioBalance
    const { currency } = currencyInfo

    const onPress = (): void => {
      onPressToken?.(currencyInfo.currencyId, currency.name)
    }

    return (
      <TouchableArea
        hapticFeedback
        alignItems="flex-start"
        bg="none"
        flexDirection="row"
        hapticStyle={ImpactFeedbackStyle.Light}
        justifyContent="space-between"
        minHeight={TOKEN_BALANCE_ITEM_HEIGHT}
        py="spacing8"
        onPress={onPress}>
        <AnimatedFlex
          row
          alignItems="center"
          entering={FadeIn}
          exiting={FadeOut}
          flexShrink={1}
          gap="spacing12"
          overflow="hidden">
          <TokenLogo
            chainId={currency.chainId}
            symbol={currency.symbol}
            url={currencyInfo.logoUrl ?? undefined}
          />
          <Flex alignItems="flex-start" flexShrink={1} gap="none">
            <Text ellipsizeMode="tail" numberOfLines={1} variant="bodyLarge">
              {currency.name ?? currency.symbol}
            </Text>
            <Flex row alignItems="center" gap="spacing8" minHeight={20}>
              <Text color="textSecondary" numberOfLines={1} variant="subheadSmall">
                {`${formatNumber(quantity, NumberType.TokenNonTx)}`} {currency.symbol}
              </Text>
            </Flex>
          </Flex>
        </AnimatedFlex>
        <AnimatedFlex entering={FadeIn} exiting={FadeOut} justifyContent="space-between">
          <WarmLoadingShimmer isWarmLoading={isWarmLoading}>
            <Flex alignItems="flex-end" gap="spacing4" pl="spacing8">
              <Text
                color={isWarmLoading ? 'textSecondary' : 'textPrimary'}
                numberOfLines={1}
                variant="bodyLarge">
                {formatUSDPrice(portfolioBalance.balanceUSD, NumberType.FiatTokenQuantity)}
              </Text>
              <Text color="textSecondary">
                <RelativeChange
                  alignRight
                  change={relativeChange24 ?? undefined}
                  negativeChangeColor={isWarmLoading ? 'textSecondary' : 'accentCritical'}
                  positiveChangeColor={isWarmLoading ? 'textSecondary' : 'accentSuccess'}
                  variant="subheadSmall"
                />
              </Text>
            </Flex>
          </WarmLoadingShimmer>
        </AnimatedFlex>
      </TouchableArea>
    )
  }
)
