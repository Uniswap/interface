import React from 'react'
import { Text } from 'src/components/Text'
import { ChainIdToCurrencyIdToPortfolioBalance } from 'src/features/dataApi/types'
import { Theme } from 'src/styles/theme'
import { formatUSDPrice } from 'src/utils/format'
import { getKeys } from 'src/utils/objects'

interface TotalBalanceViewProps {
  balances: ChainIdToCurrencyIdToPortfolioBalance
  variant?: keyof Theme['textVariants']
}

export function TotalBalance({ balances, variant = 'headlineLarge' }: TotalBalanceViewProps) {
  const totalBalance = getKeys(balances).reduce((sum, chainId) => {
    return (
      sum +
      Object.values(balances[chainId]!)
        .map((b) => b.balanceUSD)
        .reduce((chainSum, balanceUSD) => chainSum + balanceUSD, 0)
    )
  }, 0)

  // TODO (tina): add loading placeholder once useTotalBalance.isLoading is behaving correctly
  return <Text variant={variant}>{`${formatUSDPrice(totalBalance)}`}</Text>
}
