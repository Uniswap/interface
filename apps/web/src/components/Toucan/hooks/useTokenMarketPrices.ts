import { GraphQLApi } from '@universe/api'
import { useMemo } from 'react'
import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { toGraphQLChain } from 'uniswap/src/features/chains/utils'
import type { CurrencyKey } from '~/utils/currencyKey'
import { currencyKeyFromGraphQL } from '~/utils/currencyKey'
import { getNativeTokenDBAddress } from '~/utils/nativeTokens'

export type PriceMap = { [key: CurrencyKey]: number | undefined }

export function buildContractInputForAddress({
  chainId,
  address,
  resolveNativeAddress = false,
}: {
  chainId: number
  address: string
  resolveNativeAddress?: boolean
}): GraphQLApi.ContractInput {
  const chain = toGraphQLChain(chainId)
  return {
    address: resolveNativeAddress && address === ZERO_ADDRESS ? getNativeTokenDBAddress(chain) : address,
    chain,
  }
}

export function buildTokenMarketPriceKey({ chainId, address }: { chainId: number; address: string }): CurrencyKey {
  const chain = toGraphQLChain(chainId)
  return currencyKeyFromGraphQL({
    address,
    chain,
    standard: address === ZERO_ADDRESS ? GraphQLApi.TokenStandard.Native : undefined,
  })
}

/**
 * Fetches market prices for a list of token contracts and returns a currency-keyed map.
 */
export function useTokenMarketPrices(contracts: GraphQLApi.ContractInput[]): {
  priceMap: PriceMap
  loading: boolean
} {
  const { data, loading } = GraphQLApi.useUniswapPricesQuery({
    variables: { contracts },
    skip: !contracts.length,
  })

  const priceMap = useMemo(() => {
    return (
      data?.tokens?.reduce((acc: PriceMap, token) => {
        if (token) {
          acc[currencyKeyFromGraphQL(token)] = token.project?.markets?.[0]?.price?.value
        }
        return acc
      }, {}) ?? {}
    )
  }, [data?.tokens])

  return { priceMap, loading: loading && !data }
}
