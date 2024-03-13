import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useTokenDetailsNavigation } from 'src/components/TokenDetails/hooks'
import Trace from 'src/components/Trace/Trace'
import { MobileEventName } from 'src/features/telemetry/constants'
import { Flex, Separator, Text, TouchableArea, useSporeColors } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { NumberType } from 'utilities/src/format/types'
import { TokenLogo } from 'wallet/src/components/CurrencyLogo/TokenLogo'
import { InlineNetworkPill } from 'wallet/src/components/network/NetworkPill'
import { PortfolioBalance } from 'wallet/src/features/dataApi/types'
import { useLocalizationContext } from 'wallet/src/features/language/LocalizationContext'
import { AccountType } from 'wallet/src/features/wallet/accounts/types'
import { useActiveAccount, useDisplayName } from 'wallet/src/features/wallet/hooks'
import { getSymbolDisplayText } from 'wallet/src/utils/currency'
import { CurrencyId } from 'wallet/src/utils/currencyId'
import { SendButton } from './SendButton'

/**
 * Renders token balances for current chain (if any) and other chains (if any).
 * If user has no balance at all, it renders nothing.
 */
export function TokenBalances({
  currentChainBalance,
  otherChainBalances,
  onPressSend,
}: {
  currentChainBalance: PortfolioBalance | null
  otherChainBalances: PortfolioBalance[] | null
  onPressSend: () => void
}): JSX.Element | null {
  const { t } = useTranslation()

  const activeAccount = useActiveAccount()
  const accountType = activeAccount?.type
  const displayName = useDisplayName(activeAccount?.address, { includeUnitagSuffix: true })?.name
  const isReadonly = accountType === AccountType.Readonly

  const hasCurrentChainBalances = Boolean(currentChainBalance)
  const hasOtherChainBalances = Boolean(otherChainBalances && otherChainBalances.length > 0)

  const { preload, navigateWithPop } = useTokenDetailsNavigation()
  const navigateToCurrency = useCallback(
    (currencyId: CurrencyId) => {
      preload(currencyId)
      navigateWithPop(currencyId)
    },
    [navigateWithPop, preload]
  )

  if (!hasCurrentChainBalances && !hasOtherChainBalances) {
    return null
  }

  return (
    <Flex borderRadius="$rounded8" gap="$spacing24">
      {currentChainBalance && (
        <Flex gap="$spacing24">
          <Separator />
          <CurrentChainBalance
            balance={currentChainBalance}
            displayName={displayName}
            isReadonly={isReadonly}
            onPressSend={onPressSend}
          />
        </Flex>
      )}
      {hasOtherChainBalances && otherChainBalances ? (
        <Flex gap="$spacing8">
          <Text color="$neutral2" variant="subheading2">
            {t('token.balances.other')}
          </Text>
          <Flex gap="$spacing12">
            {otherChainBalances.map((balance) => {
              return (
                <OtherChainBalance
                  key={balance.currencyInfo.currency.chainId}
                  balance={balance}
                  navigate={navigateToCurrency}
                />
              )
            })}
          </Flex>
        </Flex>
      ) : null}
    </Flex>
  )
}

export function CurrentChainBalance({
  balance,
  isReadonly,
  displayName,
  onPressSend,
}: {
  balance: PortfolioBalance
  isReadonly: boolean
  displayName?: string
  onPressSend: () => void
}): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const { convertFiatAmountFormatted, formatNumberOrString } = useLocalizationContext()

  return (
    <Flex row>
      <Flex fill gap="$spacing8">
        <Text color="$neutral2" variant="subheading2">
          {isReadonly
            ? t('token.balances.viewOnly', { ownerAddress: displayName })
            : t('token.balances.main')}
        </Text>
        <Flex fill gap="$spacing4">
          <Text variant="heading3">
            {convertFiatAmountFormatted(balance.balanceUSD, NumberType.FiatTokenDetails)}
          </Text>
          <Text color="$neutral2" variant="body2">
            {formatNumberOrString({ value: balance.quantity, type: NumberType.TokenNonTx })}{' '}
            {getSymbolDisplayText(balance.currencyInfo.currency.symbol)}
          </Text>
        </Flex>
      </Flex>
      <Flex alignItems="flex-end" justifyContent="center">
        <SendButton color={colors.neutral1.val} size={iconSizes.icon28} onPress={onPressSend} />
      </Flex>
    </Flex>
  )
}

function OtherChainBalance({
  balance,
  navigate,
}: {
  balance: PortfolioBalance
  navigate: (currencyId: CurrencyId) => void
}): JSX.Element {
  const { convertFiatAmountFormatted, formatNumberOrString } = useLocalizationContext()

  return (
    <Trace logPress pressEvent={MobileEventName.TokenDetailsOtherChainButtonPressed}>
      <TouchableArea hapticFeedback onPress={(): void => navigate(balance.currencyInfo.currencyId)}>
        <Flex row alignItems="center" justifyContent="space-between">
          <Flex row alignItems="center" gap="$spacing4">
            <TokenLogo
              chainId={balance.currencyInfo.currency.chainId}
              name={balance.currencyInfo.currency.name}
              size={iconSizes.icon36}
              symbol={balance.currencyInfo.currency.symbol}
              url={balance.currencyInfo.logoUrl ?? undefined}
            />
            <Flex alignItems="flex-start">
              <Text px="$spacing4" variant="body1">
                {convertFiatAmountFormatted(balance.balanceUSD, NumberType.FiatTokenDetails)}
              </Text>
              <InlineNetworkPill
                chainId={balance.currencyInfo.currency.chainId}
                showBackgroundColor={false}
                textVariant="buttonLabel4"
              />
            </Flex>
          </Flex>
          <Text color="$neutral2" variant="body1">
            {formatNumberOrString({
              value: balance.quantity,
              type: NumberType.TokenNonTx,
            })}{' '}
            {getSymbolDisplayText(balance.currencyInfo.currency.symbol)}
          </Text>
        </Flex>
      </TouchableArea>
    </Trace>
  )
}
