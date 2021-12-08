import { Currency } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { ChainId, ChainIdTo } from 'src/constants/chains'
import { useActiveChainIds } from 'src/features/chains/utils'
import { useEthPricesQuery, useTokensQuery } from 'src/features/historicalChainData/generated/hooks'
import { useEndpoint } from 'src/features/historicalChainData/hooks'

export function useTokenPrices(tokens: Currency[]) {
  const currentChains = useActiveChainIds()

  // subgraph data is separated by chainIdo
  const chainIdToTokens = tokens.reduce<ChainIdTo<Currency[]>>((memo, cur) => {
    memo[cur.chainId as ChainId] ??= []
    memo[cur.chainId as ChainId]!.push(cur)
    return memo
  }, {})

  const chainIdToPrices: ChainIdTo<ReturnType<typeof useChainTokenPrices>> = {}

  for (const chainId of currentChains) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    chainIdToPrices[chainId] = useChainTokenPrices({
      chainId,
      currencies: chainIdToTokens[chainId] || [],
    })
  }

  const resultByChain = Object.values(chainIdToPrices).flat()
  const isLoading = resultByChain.some((r) => r.isLoading)
  const isError = resultByChain.some((r) => r.isError)

  return {
    isLoading,
    isError,
    chainIdToPrices,
  }
}

/** Return latest token prices for a given chain */
function useChainTokenPrices({
  chainId,
  currencies,
}: {
  chainId: ChainId
  currencies: Currency[]
}): {
  isLoading: boolean
  isError: boolean
  addressToPrice: { [address: Address]: { priceUSD?: number } } | null
} {
  const endpoint = useEndpoint(chainId)

  const tokens = currencies.filter((c) => c.isToken)
  const tokenList = useMemo(
    () => tokens.map((token) => token.wrapped.address.toLowerCase()),
    [tokens]
  )

  const tokensResult = useTokensQuery(
    { endpoint },
    { tokenList },
    { enabled: Boolean(endpoint && tokenList && tokenList.length > 0) }
  )

  const ethPricesResult = useEthPricesQuery(
    { endpoint },
    {},
    { enabled: Boolean(endpoint && currencies.length > 0) }
  )

  const anyIsLoading = tokensResult.isLoading || ethPricesResult.isLoading
  const anyIsError = tokensResult.isError || ethPricesResult.isError

  if (anyIsError || anyIsLoading) {
    return {
      isLoading: tokensResult.isLoading || ethPricesResult.isLoading,
      isError: tokensResult.isError || ethPricesResult.isError,
      addressToPrice: null,
    }
  }

  const addressToTokenData = tokensResult.data?.tokens.reduce<{
    [address: Address]: { address: string; derivedETH: number }
  }>((memo, tokenData) => {
    memo[tokenData.id] = {
      address: tokenData.id,
      derivedETH: parseFloat(tokenData.derivedETH),
    }
    return memo
  }, {})

  const currentEthPrice = parseFloat(ethPricesResult.data?.current[0].ethPriceUSD ?? 0)

  // TODO: value should be a `Price`
  // TODO: time-travel for price diff
  const addressToPrice = tokens.reduce<{ [address: Address]: { priceUSD?: number } }>(
    (memo, token) => {
      const address = token.wrapped.address

      const currentTokenData = addressToTokenData?.[address.toLowerCase()]

      // TODO: as Price
      const priceUSD = currentTokenData ? currentTokenData.derivedETH * currentEthPrice : undefined

      memo[address] = {
        priceUSD,
      }

      return memo
    },
    { ETH: { priceUSD: currentEthPrice } }
  )

  return {
    isLoading: anyIsLoading,
    isError: anyIsError,
    addressToPrice,
  }
}
