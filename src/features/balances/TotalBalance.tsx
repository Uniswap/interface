import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex } from 'src/components/layout/Flex'
import { Text } from 'src/components/Text'
import { ChainId, MAINNET_CHAIN_IDS } from 'src/constants/chains'
import { useTokenPrices } from 'src/features/historicalChainData/useTokenPrices'
import { AccountType } from 'src/features/wallet/accounts/types'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { currencyId } from 'src/utils/currencyId'
import { formatUSDPrice } from 'src/utils/format'

interface TotalBalanceViewProps {
  balances: CurrencyAmount<Currency>[]
}

function useTotalBalance(
  balances: CurrencyAmount<Currency>[],
  tokenPricesByChain: ReturnType<typeof useTokenPrices>
) {
  const activeAccount = useActiveAccount()
  const filteredBalances =
    activeAccount?.type === AccountType.readonly
      ? balances.filter((currencyAmount) =>
          MAINNET_CHAIN_IDS.includes(currencyAmount.currency.chainId)
        )
      : balances

  return useMemo(() => {
    return filteredBalances
      .map((currencyAmount) => {
        const currentPrice =
          tokenPricesByChain.chainIdToPrices[currencyAmount.currency.chainId as ChainId]
            ?.addressToPrice?.[currencyId(currencyAmount.currency)]?.priceUSD

        return (currentPrice ?? 0) * parseFloat(currencyAmount.toSignificant(6))
      })
      .reduce((a, b) => a + b, 0)
      .toFixed(2)
  }, [filteredBalances, tokenPricesByChain])
}

export default function TotalBalance({ balances }: TotalBalanceViewProps) {
  const { t } = useTranslation()

  const currenciesToFetch = balances.map((currencyAmount) => currencyAmount.currency)
  const tokenPricesByChain = useTokenPrices(currenciesToFetch)
  const totalBalance = useTotalBalance(balances, tokenPricesByChain)

  return (
    <Flex mt="sm" mb="lg" mx="lg" gap="sm">
      <Text variant="h5">{t('Total balance')}</Text>
      <Text variant="h1">{`${formatUSDPrice(totalBalance)}`}</Text>
    </Flex>
  )
}
