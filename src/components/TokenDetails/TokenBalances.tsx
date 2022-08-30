import React from 'react'
import { useTranslation } from 'react-i18next'
import { CurrencyLogo } from 'src/components/CurrencyLogo'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { PortfolioBalance } from 'src/features/dataApi/types'
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

  if (!currentChainBalance && !otherChainBalances) return null

  return (
    <Flex bg="backgroundContainer" borderRadius="sm" gap="lg" mx="md" p="md">
      {currentChainBalance && <CurrentChainBalance balance={currentChainBalance} />}
      {otherChainBalances && (
        <Flex>
          <Text color="textSecondary" variant="subheadSmall">
            {t('Your balance on other chains')}
          </Text>
          {otherChainBalances.map((balance) => {
            return <OtherChainBalance key={balance.currency.chainId} balance={balance} />
          })}
        </Flex>
      )}
    </Flex>
  )
}

export function CurrentChainBalance({ balance }: { balance: PortfolioBalance }) {
  const { t } = useTranslation()
  const { currency } = balance

  return (
    <Flex gap="xs">
      <Text color="textSecondary" variant="subheadSmall">
        {t('Your balance')}
      </Text>
      <Flex row alignItems="center" justifyContent="space-between">
        <Text variant="headlineMedium">
          {`${formatNumberBalance(balance.quantity)}`} {currency.symbol}
        </Text>
        <Text variant="body">{formatUSDPrice(balance.balanceUSD)}</Text>
      </Flex>
    </Flex>
  )
}

function OtherChainBalance({ balance }: { balance: PortfolioBalance }) {
  return (
    <Flex row alignItems="center" justifyContent="space-between">
      <Flex row alignItems="center">
        <CurrencyLogo currency={balance.currency} />
        <Flex alignItems="center">
          <Text variant="body">
            {formatNumberBalance(balance.quantity)} {balance.currency.symbol}
          </Text>
        </Flex>
      </Flex>
      <Text variant="body">{formatPrice(balance.balanceUSD)}</Text>
    </Flex>
  )
}
