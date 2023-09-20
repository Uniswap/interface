import { ImpactFeedbackStyle } from 'expo-haptics'
import React, { memo } from 'react'
import { useTranslation } from 'react-i18next'
import ContextMenu from 'react-native-context-menu-view'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { AnimatedFlex } from 'src/components/layout'
import { WarmLoadingShimmer } from 'src/components/loading/WarmLoadingShimmer'
import { useTokenContextMenu } from 'src/features/balances/hooks'
import { Flex, Text, TouchableArea } from 'ui/src'
import { borderRadii, spacing } from 'ui/src/theme'
import { formatNumber, formatUSDPrice, NumberType } from 'utilities/src/format/format'
import { TokenLogo } from 'wallet/src/components/CurrencyLogo/TokenLogo'
import { RelativeChange } from 'wallet/src/components/text/RelativeChange'
import { PortfolioBalance } from 'wallet/src/features/dataApi/types'
import { getSymbolDisplayText } from 'wallet/src/utils/currency'
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

  const shortenedSymbol = getSymbolDisplayText(currency.symbol)

  return (
    <ContextMenu
      actions={menuActions}
      disabled={menuActions.length === 0}
      style={{
        borderRadius: borderRadii.rounded16,
        paddingHorizontal: spacing.spacing12,
      }}
      onPress={onContextMenuPress}>
      <TouchableArea
        hapticFeedback
        alignItems="flex-start"
        bg="$transparent"
        flexDirection="row"
        hapticStyle={ImpactFeedbackStyle.Light}
        justifyContent="space-between"
        minHeight={TOKEN_BALANCE_ITEM_HEIGHT}
        px="$spacing12"
        py="$spacing8"
        onPress={onPress}>
        <AnimatedFlex
          row
          shrink
          alignItems="center"
          entering={FadeIn}
          exiting={FadeOut}
          gap="spacing12"
          overflow="hidden">
          <TokenLogo
            chainId={currency.chainId}
            symbol={currency.symbol}
            url={currencyInfo.logoUrl ?? undefined}
          />
          <Flex shrink alignItems="flex-start">
            <Text ellipsizeMode="tail" numberOfLines={1} variant="bodyLarge">
              {currency.name ?? shortenedSymbol}
            </Text>
            <Flex row alignItems="center" gap="$spacing8" minHeight={20}>
              <Text color="$neutral2" numberOfLines={1} variant="subheadSmall">
                {`${formatNumber(quantity)}`} {shortenedSymbol}
              </Text>
            </Flex>
          </Flex>
        </AnimatedFlex>
        <AnimatedFlex entering={FadeIn} exiting={FadeOut} justifyContent="space-between">
          <WarmLoadingShimmer isWarmLoading={isWarmLoading}>
            {!portfolioBalance.balanceUSD ? (
              <Flex centered fill>
                <Text color="$neutral2">{t('N/A')}</Text>
              </Flex>
            ) : (
              <Flex alignItems="flex-end" gap="$spacing4" pl="$spacing8">
                <Text color="$neutral1" numberOfLines={1} variant="bodyLarge">
                  {formatUSDPrice(portfolioBalance.balanceUSD, NumberType.FiatTokenQuantity)}
                </Text>
                <RelativeChange
                  alignRight
                  change={relativeChange24 ?? undefined}
                  negativeChangeColor="$statusCritical"
                  positiveChangeColor="$statusSuccess"
                  variant="bodySmall"
                />
              </Flex>
            )}
          </WarmLoadingShimmer>
        </AnimatedFlex>
      </TouchableArea>
    </ContextMenu>
  )
})
