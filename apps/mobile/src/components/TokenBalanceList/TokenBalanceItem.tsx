import { ImpactFeedbackStyle } from 'expo-haptics'
import React, { memo } from 'react'
import ContextMenu from 'react-native-context-menu-view'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { useAppTheme } from 'src/app/hooks'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { TokenLogo } from 'src/components/CurrencyLogo/TokenLogo'
import { AnimatedFlex, Flex } from 'src/components/layout'
import { WarmLoadingShimmer } from 'src/components/loading/WarmLoadingShimmer'
import { Text } from 'src/components/Text'
import { RelativeChange } from 'src/components/text/RelativeChange'
import { useTokenBalanceContextMenu } from 'src/features/balances/hooks'
import { PortfolioBalance } from 'wallet/src/features/dataApi/types'
import { CurrencyId } from 'wallet/src/utils/currencyId'
import { formatNumber, formatUSDPrice, NumberType } from 'wallet/src/utils/format'

interface TokenBalanceItemProps {
  portfolioBalance: PortfolioBalance
  onPressToken?: (currencyId: CurrencyId) => void
  isWarmLoading?: boolean
  owner: Address
}

export const TOKEN_BALANCE_ITEM_HEIGHT = 56

export const TokenBalanceItem = memo(
  ({ portfolioBalance, onPressToken, isWarmLoading, owner }: TokenBalanceItemProps) => {
    const { quantity, currencyInfo, relativeChange24, balanceUSD } = portfolioBalance
    const { currency, currencyId, isSpam } = currencyInfo
    const theme = useAppTheme()

    const onPress = (): void => {
      onPressToken?.(currencyInfo.currencyId)
    }

    const { menuActions, onContextMenuPress } = useTokenBalanceContextMenu({
      currencyId,
      owner,
      isSpam,
      balanceUSD,
    })

    return (
      <ContextMenu
        actions={menuActions}
        disabled={menuActions.length === 0}
        style={{
          borderRadius: theme.borderRadii.rounded16,
          paddingHorizontal: theme.spacing.spacing12,
        }}
        onPress={onContextMenuPress}>
        <TouchableArea
          hapticFeedback
          alignItems="flex-start"
          bg="none"
          flexDirection="row"
          hapticStyle={ImpactFeedbackStyle.Light}
          justifyContent="space-between"
          minHeight={TOKEN_BALANCE_ITEM_HEIGHT}
          px="spacing12"
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
                  {`${formatNumber(quantity)}`} {currency.symbol}
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
      </ContextMenu>
    )
  }
)
