import { skipToken } from '@reduxjs/toolkit/dist/query'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { ChainId } from 'src/constants/chains'
import {
  TESTNET_BALANCE_AMOUNT,
  TESTNET_BALANCE_USD,
  TESTNET_RELATIVE_CHANGE_24,
} from 'src/features/dataApi/constants'
import { dataApi, useBalancesQuery } from 'src/features/dataApi/slice'
import {
  ChainIdToCurrencyIdToPortfolioBalance,
  PortfolioBalance,
  PortfolioBalances,
  SerializablePortfolioBalance,
} from 'src/features/dataApi/types'
import { useAllCurrencies } from 'src/features/tokens/useTokens'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { isTestnet } from 'src/utils/chainId'
import { buildCurrencyId, currencyId, CurrencyId } from 'src/utils/currencyId'
import { logger } from 'src/utils/logger'

function useChainBalances(
  chainId: ChainId,
  address: Address | undefined,
  // Currencies that the app knows about and tracks
  // This is mostly to ensure we surface high quality tokens,
  // and avoid displaying scam tokens
  knownCurrencies: Record<CurrencyId, Currency> = {}
): {
  balances: { [currency: CurrencyId]: PortfolioBalance }
  loading: boolean
} {
  const { currentData: data, isLoading: loading } = useBalancesQuery(
    address ? { chainId, address } : skipToken
  )

  return useMemo(
    () => ({
      loading,
      balances: !data
        ? {}
        : // Filter out unknown currencies and transform output for ease of use
          Object.values(data).reduce<PortfolioBalances>(
            (portfolioBalances: PortfolioBalances, item: SerializablePortfolioBalance) => {
              const id = buildCurrencyId(chainId, item.contract_address)
              const currency = knownCurrencies[id]

              if (!currency) {
                logger.info(
                  'balances',
                  'useChainBalances',
                  'Ignoring item with balance: ',
                  id,
                  item.contract_ticker_symbol
                )
              } else {
                portfolioBalances[id] = {
                  amount: CurrencyAmount.fromRawAmount(currency, item.balance),
                  balanceUSD: item.balanceUSD,
                  relativeChange24: item.relativeChange24,
                }
              }

              return portfolioBalances
            },
            {}
          ),
    }),
    [chainId, knownCurrencies, data, loading]
  )
}

export function useAllBalancesByChainId(chainIds: ChainId[]): {
  balances: ChainIdToCurrencyIdToPortfolioBalance
  loading: boolean
} {
  const address = useActiveAccount()?.address

  let balancesByChainId: ChainIdToCurrencyIdToPortfolioBalance | null = null
  let loading = false

  const tokensByChainId = useAllCurrencies()

  for (const chainId of chainIds) {
    balancesByChainId ??= {}

    if (isTestnet(chainId)) {
      balancesByChainId[chainId] = Object.keys(tokensByChainId[chainId] ?? {}).reduce<
        Record<CurrencyId, PortfolioBalance>
      >((memo, id) => {
        const currency = tokensByChainId[chainId]?.[id]
        if (currency) {
          memo[id] = {
            amount: CurrencyAmount.fromRawAmount(
              currency,
              TESTNET_BALANCE_AMOUNT * 10 ** currency.decimals
            ),
            balanceUSD: TESTNET_BALANCE_USD,
            relativeChange24: TESTNET_RELATIVE_CHANGE_24,
          }
        }
        return memo
      }, {})
      continue
    }

    // chainIds content is stable
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const balances = useChainBalances(chainId, address, tokensByChainId[chainId])

    balancesByChainId[chainId] = balances.balances
    loading = loading || balances.loading
  }

  return useMemo(
    () => ({
      balances: balancesByChainId ?? {},
      loading,
    }),
    [balancesByChainId, loading]
  )
}

/**
 * Retrieves balance for a single currency from the API cache.
 * Assumes the input currency is a known token.
 */
export function useSingleBalance(currency: Currency): PortfolioBalance | null {
  const address = useActiveAccount()?.address
  const balance = dataApi.endpoints.balances.useQueryState(
    address
      ? {
          chainId: currency.chainId,
          address,
        }
      : skipToken,
    {
      // selectFromResult allows for performant re-renders
      selectFromResult: ({ data }): PortfolioBalance | null => {
        const cacheEntry = data?.[currencyId(currency)]
        if (!cacheEntry) return null
        return {
          amount: CurrencyAmount.fromRawAmount(currency, cacheEntry.balance),
          balanceUSD: cacheEntry.balanceUSD,
          relativeChange24: cacheEntry.relativeChange24,
        }
      },
    }
  )
  return balance
}
