import { useCallback, useEffect, useMemo, useState } from 'react'
import { SafetyLevel } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { ALL_NETWORKS_ARG } from 'uniswap/src/data/rest/base'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { buildCurrency, buildCurrencyInfo, getCurrencySafetyInfo } from 'uniswap/src/features/dataApi/utils'
import { currencyId } from 'uniswap/src/utils/currencyId'

export type StockTokenListItem = {
  chainId: number
  address: string
  name: string
  symbol: string
  decimals: number
  logoURI?: string
}

export type StockTokenListResponse = {
  tokens: StockTokenListItem[]
}

export function stockTokenToCurrencyInfo(token: StockTokenListItem): CurrencyInfo | null {
  const { chainId, address, symbol, name, decimals, logoURI } = token

  if (!chainId || !address || !symbol || !name) {
    return null
  }

  const currency = buildCurrency({
    chainId,
    address,
    decimals,
    symbol,
    name,
  })

  if (!currency) {
    return null
  }

  return buildCurrencyInfo({
    currency,
    currencyId: currencyId(currency),
    logoUrl: logoURI,
    safetyInfo: getCurrencySafetyInfo(SafetyLevel.Verified, undefined),
  })
}

const STOCK_LIST = 'https://raw.githubusercontent.com/RingProtocol/token-list/master/stock.tokenlist.json'

export function useStockTokensQuery(chainId: string): {
  data: StockTokenListResponse | undefined
  isLoading: boolean
  isFetching: boolean
  error: Error | undefined
  refetch: () => Promise<void>
} {
  const [data, setData] = useState<StockTokenListResponse | undefined>()
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isFetching, setIsFetching] = useState<boolean>(false)
  const [error, setError] = useState<Error | undefined>()

  const fetchData = useCallback(async (): Promise<void> => {
    try {
      setIsFetching(true)

      const res = await fetch(STOCK_LIST)
      if (!res.ok) {
        throw new Error('Failed to fetch stock token list')
      }

      const json = (await res.json()) as StockTokenListResponse

      const filtered =
        chainId === ALL_NETWORKS_ARG ? json : { tokens: json.tokens.filter((t) => t.chainId === Number(chainId)) }

      setData(filtered)
      setError(undefined)
    } catch (err) {
      setError(err as Error)
    } finally {
      setIsLoading(false)
      setIsFetching(false)
    }
  }, [chainId])

  useEffect(() => {
    setIsLoading(true)
    fetchData().catch(() => {})
  }, [fetchData])

  return {
    data,
    isLoading,
    isFetching,
    error,
    refetch: fetchData,
  }
}

export function useStockTokensCurrencyInfos(
  chainFilter: Maybe<UniverseChainId>,
  skip?: boolean,
): {
  data: CurrencyInfo[] | undefined
  error: Error | undefined
  refetch: () => void
  loading: boolean
} {
  const chainIdStr = chainFilter ? chainFilter.toString() : ALL_NETWORKS_ARG

  const { data, isLoading, isFetching, error, refetch } = useStockTokensQuery(chainIdStr)

  const formattedTokens = useMemo((): CurrencyInfo[] | undefined => {
    if (!data?.tokens) {
      return undefined
    }
    return data.tokens.map(stockTokenToCurrencyInfo).filter((t): t is CurrencyInfo => Boolean(t))
  }, [data])

  if (skip) {
    return {
      data: undefined,
      loading: false,
      error: undefined,
      refetch: (): void => {},
    }
  }

  return {
    data: formattedTokens,
    loading: isLoading || isFetching,
    error: error ?? undefined,
    refetch: (): void => {
      refetch().catch(() => {})
    },
  }
}
