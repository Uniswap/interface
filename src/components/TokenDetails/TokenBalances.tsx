import React from 'react'
import { useTranslation } from 'react-i18next'
import { CurrencyLogo } from 'src/components/CurrencyLogo'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { PortfolioBalance } from 'src/features/dataApi/types'
import { AccountType } from 'src/features/wallet/accounts/types'
import { useActiveAccount, useDisplayName } from 'src/features/wallet/hooks'
import { formatNumberBalance, formatPrice, formatUSDPrice } from 'src/utils/format'

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

  if (!currentChainBalance && !otherChainBalances) return null

  return (
    <Flex bg="background2" borderRadius="sm" gap="lg" mx="md" p="md">
      {currentChainBalance && (
        <CurrentChainBalance
          balance={currentChainBalance}
          displayName={displayName}
          isReadonly={isReadonly}
        />
      )}
      {otherChainBalances && otherChainBalances.length > 0 && (
        <Flex>
          <Text color="textSecondary" variant="subheadSmall">
            {isReadonly
              ? t("{{owner}}'s balance on other chains", { owner: displayName })
              : t('Your balance on other chains')}
          </Text>
          {otherChainBalances.map((balance) => {
            return (
              <OtherChainBalance key={balance.currencyInfo.currency.chainId} balance={balance} />
            )
          })}
        </Flex>
      )}
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
      <Text color="textSecondary" variant="subheadSmall">
        {isReadonly ? t("{{owner}}'s balance", { owner: displayName }) : t('Your balance')}
      </Text>
      <Flex row alignItems="center" justifyContent="space-between">
        <Text variant="headlineMedium">
          {`${formatNumberBalance(balance.quantity)}`} {balance.currencyInfo.currency.symbol}
        </Text>
        <Text variant="bodyLarge">{formatUSDPrice(balance.balanceUSD)}</Text>
      </Flex>
    </Flex>
  )
}

function OtherChainBalance({ balance }: { balance: PortfolioBalance }) {
  return (
    <Flex row alignItems="center" justifyContent="space-between">
      <Flex row alignItems="center">
        <CurrencyLogo currency={balance.currencyInfo.currency} />
        <Flex alignItems="center">
          <Text variant="bodyLarge">
            {formatNumberBalance(balance.quantity)} {balance.currencyInfo.currency.symbol}
          </Text>
        </Flex>
      </Flex>
      <Text variant="bodyLarge">{formatPrice(balance.balanceUSD)}</Text>
    </Flex>
  )
}
