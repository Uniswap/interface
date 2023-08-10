import { ImpactFeedbackStyle } from 'expo-haptics'
import React, { memo } from 'react'
import { useTranslation } from 'react-i18next'
import ContextMenu from 'react-native-context-menu-view'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { useAppTheme } from 'src/app/hooks'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { AnimatedFlex, Flex } from 'src/components/layout'
import { WarmLoadingShimmer } from 'src/components/loading/WarmLoadingShimmer'
import { Text } from 'src/components/Text'
import { RelativeChange } from 'src/components/text/RelativeChange'
import { useTokenContextMenu } from 'src/features/balances/hooks'
import { formatNumber, formatUSDPrice, NumberType } from 'utilities/src/format/format'
import { TokenLogo } from 'wallet/src/components/CurrencyLogo/TokenLogo'
import { PortfolioBalance } from 'wallet/src/features/dataApi/types'
import { CurrencyId } from 'wallet/src/utils/currencyId'

interface TokenBalanceItemProps {
  portfolioBalance: PortfolioBalance
  onPressToken?: (currencyId: CurrencyId) => void
  isWarmLoading?: boolean
}

export const TOKEN_BALANCE_ITEM_HEIGHT = 56

export const TokenBalanceItem = memo(function _TokenBalanceItem({
  portfolioBalance,
  onPressToken,
  isWarmLoading,
}: TokenBalanceItemProps) {
  const { quantity, currencyInfo, relativeChange24, balanceUSD } = portfolioBalance
  const { currency, currencyId, isSpam } = currencyInfo
  const { t } = useTranslation()
  const theme = useAppTheme()

  const onPress = (): void => {
    onPressToken?.(currencyInfo.currencyId)
  }

  const { menuActions, onContextMenuPress } = useTokenContextMenu({
    currencyId,
    isSpam,
    balanceUSD,
    isNative: currency.isNative,
    accountHoldsToken: true,
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
              <Text color="neutral2" numberOfLines={1} variant="subheadSmall">
                {`${formatNumber(quantity)}`} {currency.symbol}
              </Text>
            </Flex>
          </Flex>
        </AnimatedFlex>
        <AnimatedFlex entering={FadeIn} exiting={FadeOut} justifyContent="space-between">
          <WarmLoadingShimmer isWarmLoading={isWarmLoading}>
            {!portfolioBalance.balanceUSD ? (
              <Flex centered flex={1}>
                <Text color="neutral2">{t('N/A')}</Text>
              </Flex>
            ) : (
              <Flex alignItems="flex-end" gap="spacing4" pl="spacing8">
                <Text
                  color={isWarmLoading ? 'neutral2' : 'neutral1'}
                  numberOfLines={1}
                  variant="bodyLarge">
                  {formatUSDPrice(portfolioBalance.balanceUSD, NumberType.FiatTokenQuantity)}
                </Text>
                <Text color="neutral2">
                  <RelativeChange
                    alignRight
                    change={relativeChange24 ?? undefined}
                    negativeChangeColor={isWarmLoading ? 'neutral2' : 'statusCritical'}
                    positiveChangeColor={isWarmLoading ? 'neutral2' : 'statusSuccess'}
                    variant="subheadSmall"
                  />
                </Text>
              </Flex>
            )}
          </WarmLoadingShimmer>
        </AnimatedFlex>
      </TouchableArea>
    </ContextMenu>
  )
})
