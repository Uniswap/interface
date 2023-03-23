import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { useTokenBalancesWithLoadingIndicator } from 'lib/hooks/useCurrencyBalance'
import { fetchUSDPrice } from 'nft/utils/fetchUSDPrice'
import { useEffect, useMemo, useState } from 'react'

import { useDefaultActiveTokens } from '../../hooks/Tokens'

export {
  default as useCurrencyBalance,
  useCurrencyBalances,
  useNativeCurrencyBalances,
  useTokenBalance,
  useTokenBalances,
  useTokenBalancesWithLoadingIndicator,
} from 'lib/hooks/useCurrencyBalance'

export type BalancesResult = { [tokenAddress: string]: CurrencyAmount<Token> | undefined }
export type PricesResult = { [tokenAddress: string]: number | undefined } | undefined

// mimics useAllBalances
export function useAllTokenBalances(): [BalancesResult, boolean] {
  const { account } = useWeb3React()
  const allTokens = useDefaultActiveTokens()
  const allTokensArray = useMemo(() => Object.values(allTokens ?? {}), [allTokens])
  const [balances, balancesIsLoading] = useTokenBalancesWithLoadingIndicator(account ?? undefined, allTokensArray)
  return [balances ?? {}, balancesIsLoading]
}

export function useTokenPrices(balances: BalancesResult): PricesResult {
  const [prices, setPrices] = useState<PricesResult | undefined>(undefined)
  useEffect(() => {
    loadPrices()
    async function loadPrices() {
      const tokensWithBalance: CurrencyAmount<Token>[] = Object.values(balances).filter(
        (balance) => balance?.greaterThan(0) // filters undefined values so we can cast safely
      ) as CurrencyAmount<Token>[]
      const pricesEntries = await Promise.all(
        tokensWithBalance.map(async (token) => {
          const price = await fetchUSDPrice(token)
          return [token.currency.address, price]
        })
      )

      setPrices(Object.fromEntries(pricesEntries))
    }
  }, [balances])
  return prices
}
