import React from 'react'
import { useTranslation } from 'react-i18next'
import { TokenLogo } from 'src/components/CurrencyLogo/TokenLogo'
import { Flex } from 'src/components/layout'
import { Separator } from 'src/components/layout/Separator'
import { InlineNetworkPill } from 'src/components/Network/NetworkPill'
import { Text } from 'src/components/Text'
import { PortfolioBalance } from 'src/features/dataApi/types'
import { AccountType } from 'src/features/wallet/accounts/types'
import { useActiveAccount, useDisplayName } from 'src/features/wallet/hooks'
import { iconSizes } from 'src/styles/sizing'
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
}) {
  const { t } = useTranslation()

  const activeAccount = useActiveAccount()
  const accountType = activeAccount?.type
  const displayName = useDisplayName(activeAccount?.address)?.name
  const isReadonly = accountType === AccountType.Readonly

  const hasCurrentChainBalances = Boolean(currentChainBalance)
  const hasOtherChainBalances = Boolean(otherChainBalances && otherChainBalances.length > 0)

  if (!hasCurrentChainBalances && !hasOtherChainBalances) return null

  return (
    <Flex borderRadius="sm" gap="lg" px="md">
      {currentChainBalance && (
        <CurrentChainBalance
          balance={currentChainBalance}
          displayName={displayName}
          isReadonly={isReadonly}
        />
      )}
      {hasOtherChainBalances && (
        <Flex>
          <Text color="textTertiary" variant="subheadSmall">
            {t('Balances on other networks')}
          </Text>
          <Flex gap="sm">
            {otherChainBalances!.map((balance) => {
              return (
                <OtherChainBalance key={balance.currencyInfo.currency.chainId} balance={balance} />
              )
            })}
          </Flex>
        </Flex>
      )}
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
}) {
  const { t } = useTranslation()

  return (
    <Flex gap="xs">
      <Text color="textTertiary" variant="subheadSmall">
        {isReadonly ? t("{{owner}}'s balance", { owner: displayName }) : t('Your balance')}
      </Text>
      <Flex row alignItems="center" gap="xs">
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

function OtherChainBalance({ balance }: { balance: PortfolioBalance }) {
  return (
    <Flex row alignItems="center" justifyContent="space-between">
      <Flex row alignItems="center" gap="xxs">
        <TokenLogo
          chainId={balance.currencyInfo.currency.chainId}
          size={iconSizes.xxl}
          symbol={balance.currencyInfo.currency.symbol}
          url={balance.currencyInfo.logoUrl ?? undefined}
        />
        <Flex alignItems="center" gap="none">
          <Text variant="bodyLarge">
            {formatNumber(balance.balanceUSD, NumberType.FiatTokenDetails)}
          </Text>
          <InlineNetworkPill
            chainId={balance.currencyInfo.currency.chainId}
            py="none"
            showBackgroundColor={false}
            textVariant="buttonLabelMicro"
          />
        </Flex>
      </Flex>
      <Text color="textSecondary" variant="bodyLarge">
        {formatNumber(balance.quantity, NumberType.TokenNonTx)}{' '}
        {balance.currencyInfo.currency.symbol}
      </Text>
    </Flex>
  )
}
