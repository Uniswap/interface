import { GraphQLApi } from '@universe/api'
import { useMemo } from 'react'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { toContractInput } from '~/appGraphql/data/util'
import { PositionInfo } from '~/pages/PoolDetails/Pools/cache'
import { CurrencyKey, currencyKey, currencyKeyFromGraphQL } from '~/utils/currencyKey'

type PriceMap = { [key: CurrencyKey]: number | undefined }
export function usePoolPriceMap(positions: PositionInfo[] | undefined) {
  const { defaultChainId } = useEnabledChains()
  const contracts = useMemo(() => {
    if (!positions || !positions.length) {
      return []
    }
    // Avoids fetching duplicate tokens by placing in map
    const contractMap = positions.reduce(
      (acc: { [key: string]: GraphQLApi.ContractInput }, { pool: { token0, token1 } }) => {
        acc[currencyKey(token0)] = toContractInput(token0, defaultChainId)
        acc[currencyKey(token1)] = toContractInput(token1, defaultChainId)
        return acc
      },
      {},
    )
    return Object.values(contractMap)
  }, [defaultChainId, positions])

  const { data, loading } = GraphQLApi.useUniswapPricesQuery({ variables: { contracts }, skip: !contracts.length })

  const priceMap = useMemo(
    () =>
      data?.tokens?.reduce((acc: PriceMap, current) => {
        if (current) {
          acc[currencyKeyFromGraphQL(current)] = current.project?.markets?.[0]?.price?.value
        }
        return acc
      }, {}) ?? {},
    [data?.tokens],
  )

  return { priceMap, pricesLoading: loading && !data }
}
