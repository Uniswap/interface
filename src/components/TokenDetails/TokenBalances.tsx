import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { TokenLogo } from 'src/components/CurrencyLogo/TokenLogo'
import { Box, Flex } from 'src/components/layout'
import { Separator } from 'src/components/layout/Separator'
import { InlineNetworkPill } from 'src/components/Network/NetworkPill'
import { Text } from 'src/components/Text'
import { useTokenDetailsNavigation } from 'src/components/TokenDetails/hooks'
import { PortfolioBalance } from 'src/features/dataApi/types'
import { EventName } from 'src/features/telemetry/constants'
import { AccountType } from 'src/features/wallet/accounts/types'
import { useActiveAccount, useDisplayName } from 'src/features/wallet/hooks'
import { iconSizes } from 'src/styles/sizing'
import { CurrencyId } from 'src/utils/currencyId'
import { formatNumber, NumberType } from 'src/utils/format'

/**
 * Renders token balances for current chain (if any) and other chains (if any).
 * If user has no balance at all, it renders nothing.
 */
export function TokenBalances({
  currentChainBalance,
  otherChainBalances,
}: {
  currentChainBalance: PortfolioBalance | null
  otherChainBalances: PortfolioBalance[] | null
}): JSX.Element | null {
  const { t } = useTranslation()

  const activeAccount = useActiveAccount()
  const accountType = activeAccount?.type
  const displayName = useDisplayName(activeAccount?.address)?.name
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

  if (!hasCurrentChainBalances && !hasOtherChainBalances) return null

  return (
    <Flex borderRadius="rounded8" gap="spacing24" px="spacing16">
      {currentChainBalance && (
        <CurrentChainBalance
          balance={currentChainBalance}
          displayName={displayName}
          isReadonly={isReadonly}
        />
      )}
      {hasOtherChainBalances && otherChainBalances ? (
        <Flex>
          <Text color="textTertiary" variant="subheadSmall">
            {t('Balances on other networks')}
          </Text>
          <Flex gap="spacing12">
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
      <Separator />
    </Flex>
  )
}

export function CurrentChainBalance({
  balance,
  isReadonly,
  displayName,
}: {
  balance: PortfolioBalance
  isReadonly: boolean
  displayName?: string
}): JSX.Element {
  const { t } = useTranslation()

  return (
    <Flex gap="spacing8">
      <Text color="textTertiary" variant="subheadSmall">
        {isReadonly ? t("{{owner}}'s balance", { owner: displayName }) : t('Your balance')}
      </Text>
      <Flex row alignItems="center" gap="spacing8">
        <Text variant="subheadLarge">
          {formatNumber(balance.balanceUSD, NumberType.FiatTokenDetails)}
        </Text>
        <Text color="textSecondary" variant="subheadLarge">
          ({formatNumber(balance.quantity, NumberType.TokenNonTx)}{' '}
          {balance.currencyInfo.currency.symbol})
        </Text>
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
  return (
    <TouchableArea
      hapticFeedback
      eventName={EventName.TokenDetailsOtherChainButtonPressed}
      onPress={(): void => navigate(balance.currencyInfo.currencyId)}>
      <Flex row alignItems="center" justifyContent="space-between">
        <Flex row alignItems="center" gap="spacing4">
          <TokenLogo
            chainId={balance.currencyInfo.currency.chainId}
            size={iconSizes.icon36}
            symbol={balance.currencyInfo.currency.symbol}
            url={balance.currencyInfo.logoUrl ?? undefined}
          />
          <Box>
            <Text px="spacing4" variant="bodyLarge">
              {formatNumber(balance.balanceUSD, NumberType.FiatTokenDetails)}
            </Text>
            <InlineNetworkPill
              chainId={balance.currencyInfo.currency.chainId}
              py="none"
              showBackgroundColor={false}
              textVariant="buttonLabelMicro"
            />
          </Box>
        </Flex>
        <Text color="textSecondary" variant="bodyLarge">
          {formatNumber(balance.quantity, NumberType.TokenNonTx)}{' '}
          {balance.currencyInfo.currency.symbol}
        </Text>
      </Flex>
    </TouchableArea>
  )
}
