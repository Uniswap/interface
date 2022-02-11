import { Currency } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { NATIVE_ADDRESS } from 'src/constants/addresses'
import { ALL_SUPPORTED_CHAIN_IDS, ChainId, ChainIdTo } from 'src/constants/chains'
import { useActiveChainIds } from 'src/features/chains/utils'
import {
  useEthPricesQuery,
  useTokensQuery,
} from 'src/features/historicalChainData/generated/uniswap-hooks'
import { buildCurrencyId } from 'src/utils/currencyId'
import { logger } from 'src/utils/logger'
import { NativeCurrency } from '../tokenLists/NativeCurrency'

export function useTokenPrices(tokens: Currency[]) {
  const activeChains = useActiveChainIds()

  // subgraph data is separated by chainId
  const chainIdToTokens = tokens.reduce<ChainIdTo<Currency[]>>((memo, cur) => {
    memo[cur.chainId as ChainId] ??= []
    memo[cur.chainId as ChainId]!.push(cur)
    return memo
  }, {})

  const chainIdToPrices: ChainIdTo<ReturnType<typeof useChainTokenPrices>> = {}

  for (const chainId of ALL_SUPPORTED_CHAIN_IDS) {
    try {
      const isEnabled = activeChains.includes(chainId)
      // TODO Restructured use*Query calls to avoid loop of hooks
      // eslint-disable-next-line react-hooks/rules-of-hooks
      chainIdToPrices[chainId] = useChainTokenPrices({
        chainId,
        currencies: chainIdToTokens[chainId] || [],
        isEnabled,
      })
    } catch (e) {
      logger.debug('useTokenPrices', '', 'useTokenPrices failed: ', e)
      chainIdToPrices[chainId] = { isLoading: false, isError: true, addressToPrice: {} }
    }
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
  isEnabled,
}: {
  chainId: ChainId
  currencies: Currency[]
  isEnabled: boolean
}): {
  isLoading: boolean
  isError: boolean
  addressToPrice: { [address: Address]: { priceUSD?: number } } | null
} {
  // always retrieve wrapped native price to build native price
  const nativeCurrencyWrapped = NativeCurrency.onChain(chainId).wrapped
  if (isEnabled) {
    currencies.push(nativeCurrencyWrapped)
  }

  // build token list consumable by graphql
  const tokens = currencies.filter((c) => c.isToken)
  const tokenList = useMemo(
    () => tokens.map((token) => token.wrapped.address.toLowerCase()),
    [tokens]
  )

  // TODO: consider different cache policies like partial
  const tokensResult = useTokensQuery({
    variables: { chainId, tokenList },
    skip: !(isEnabled && tokenList && tokenList.length > 0),
  })

  const ethPricesResult = useEthPricesQuery({
    variables: { chainId },
    skip: !(isEnabled && currencies.length > 0),
  })

  const anyIsLoading = Boolean(tokensResult.loading || ethPricesResult.loading)
  const anyIsError = Boolean(tokensResult.error || ethPricesResult.error)

  if (anyIsError || anyIsLoading || !isEnabled) {
    return {
      isLoading: anyIsLoading,
      isError: anyIsError,
      addressToPrice: null,
    }
  }

  const currentEthPrice = parseFloat(ethPricesResult.data?.current[0].ethPriceUSD ?? 0)

  const addressToTokenData = tokensResult.data?.tokens.reduce<{
    [address: Address]: { address: string; derivedETH: number }
  }>((memo, tokenData) => {
    memo[tokenData.id] = {
      address: tokenData.id.toLowerCase(),
      derivedETH: parseFloat(tokenData.derivedETH),
    }
    return memo
  }, {})

  // subgraph only has ETH price in USD
  const nativeDerivedEth =
    addressToTokenData?.[nativeCurrencyWrapped.address.toLowerCase()]?.derivedETH ?? 0

  // TODO: value should be a `Price`
  // TODO: time-travel for price diff
  const addressToPrice = tokens.reduce<{ [address: Address]: { priceUSD?: number } }>(
    (memo, { wrapped: { address } }) => {
      const currentTokenData = addressToTokenData?.[address.toLowerCase()]

      memo[buildCurrencyId(chainId, address)] = {
        priceUSD: derivedEthToUsd(currentTokenData?.derivedETH, currentEthPrice),
      }

      return memo
    },
    {
      [buildCurrencyId(chainId, NATIVE_ADDRESS)]: {
        priceUSD: derivedEthToUsd(nativeDerivedEth, currentEthPrice),
      },
    }
  )

  return {
    isLoading: anyIsLoading,
    isError: anyIsError,
    addressToPrice,
  }
}

const derivedEthToUsd = (derivedETH: number | undefined, ethPrice: number | undefined) =>
  derivedETH && ethPrice ? derivedETH * ethPrice : undefined
