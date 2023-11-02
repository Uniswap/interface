import { ImpactFeedbackStyle } from 'expo-haptics'
import React, { memo } from 'react'
import { useTranslation } from 'react-i18next'
import ContextMenu from 'react-native-context-menu-view'
import { WarmLoadingShimmer } from 'src/components/loading/WarmLoadingShimmer'
import { useTokenContextMenu } from 'src/features/balances/hooks'
import { disableOnPress } from 'src/utils/disableOnPress'
import { Flex, Text, TouchableArea } from 'ui/src'
import { borderRadii } from 'ui/src/theme'
import { NumberType } from 'utilities/src/format/types'
import { TokenLogo } from 'wallet/src/components/CurrencyLogo/TokenLogo'
import { RelativeChange } from 'wallet/src/components/text/RelativeChange'
import { PortfolioBalance } from 'wallet/src/features/dataApi/types'
import { useFiatConverter } from 'wallet/src/features/fiatCurrency/conversion'
import { useLocalizedFormatter } from 'wallet/src/features/language/formatter'
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
  const { convertFiatAmountFormatted } = useFiatConverter()
  const { formatNumberOrString } = useLocalizedFormatter()

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
  const balance = convertFiatAmountFormatted(
    portfolioBalance.balanceUSD,
    NumberType.FiatTokenQuantity
  )

  return (
    <ContextMenu
      actions={menuActions}
      disabled={menuActions.length === 0}
      style={{
        borderRadius: borderRadii.rounded16,
      }}
      onPress={onContextMenuPress}>
      <TouchableArea
        hapticFeedback
        alignItems="flex-start"
        bg="$surface1"
        borderRadius="$rounded16"
        flexDirection="row"
        hapticStyle={ImpactFeedbackStyle.Light}
        justifyContent="space-between"
        minHeight={TOKEN_BALANCE_ITEM_HEIGHT}
        px="$spacing24"
        py="$spacing8"
        onLongPress={disableOnPress}
        onPress={onPress}>
        <Flex row shrink alignItems="center" gap="$spacing12" overflow="hidden">
          <TokenLogo
            chainId={currency.chainId}
            symbol={currency.symbol}
            url={currencyInfo.logoUrl ?? undefined}
          />
          <Flex shrink alignItems="flex-start">
            <Text ellipsizeMode="tail" numberOfLines={1} variant="body1">
              {currency.name ?? shortenedSymbol}
            </Text>
            <Flex row alignItems="center" gap="$spacing8" minHeight={20}>
              <Text color="$neutral2" numberOfLines={1} variant="subheading2">
                {`${formatNumberOrString({ value: quantity })}`} {shortenedSymbol}
              </Text>
            </Flex>
          </Flex>
        </Flex>
        <Flex justifyContent="space-between">
          <WarmLoadingShimmer isWarmLoading={isWarmLoading}>
            {!portfolioBalance.balanceUSD ? (
              <Flex centered fill>
                <Text color="$neutral2">{t('N/A')}</Text>
              </Flex>
            ) : (
              <Flex alignItems="flex-end" pl="$spacing8">
                <Text color="$neutral1" numberOfLines={1} variant="body1">
                  {balance}
                </Text>
                <RelativeChange
                  alignRight
                  change={relativeChange24 ?? undefined}
                  negativeChangeColor="$statusCritical"
                  positiveChangeColor="$statusSuccess"
                  variant="body2"
                />
              </Flex>
            )}
          </WarmLoadingShimmer>
        </Flex>
      </TouchableArea>
    </ContextMenu>
  )
})
