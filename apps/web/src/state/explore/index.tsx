import { ExploreStatsResponse, ProtocolStatsResponse } from '@uniswap/client-explore/dist/uniswap/explore/v1/service_pb'
import { useRingExploreStatsQuery } from 'appGraphql/data/ring/useRingExploreStats'
import { useRingProtocolStatsQuery } from 'appGraphql/data/ring/useRingProtocolStats'
import { createContext, useMemo } from 'react'
import { Chain } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { useExploreStatsQuery } from 'uniswap/src/data/rest/exploreStats'
import { useProtocolStatsQuery } from 'uniswap/src/data/rest/protocolStats'
import { useIsSupportedChainId } from 'uniswap/src/features/chains/hooks/useSupportedChainId'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { toGraphQLChain } from 'uniswap/src/features/chains/utils'

interface QueryResult<T> {
  data?: T
  isLoading: boolean
  error: boolean
}

/**
 * ExploreContextType
 * @property exploreStatsData - Data for the Explore Tokens and Pools table
 * @property protocolStatsData - Data for the Protocol Stats Graphs
 */
interface ExploreContextType {
  exploreStats: QueryResult<ExploreStatsResponse>
  protocolStats: QueryResult<ProtocolStatsResponse>
  ringExploreStats: QueryResult<any>
  ringProtocolStats: QueryResult<any>
}

export const giveExploreStatDefaultValue = (value: number | undefined, defaultValue = 0): number => {
  return value ?? defaultValue
}

export const ExploreContext = createContext<ExploreContextType>({
  exploreStats: {
    data: undefined,
    isLoading: false,
    error: false,
  },
  protocolStats: {
    data: undefined,
    isLoading: false,
    error: false,
  },
  ringExploreStats: {
    data: undefined,
    isLoading: false,
    error: false,
  },
  ringProtocolStats: {
    data: undefined,
    isLoading: false,
    error: false,
  },
})

export const TABLE_PAGE_SIZE = 20

export function ExploreContextProvider({
  chainId,
  children,
}: {
  chainId?: UniverseChainId
  children: React.ReactNode
}) {
  const isSupportedChain = useIsSupportedChainId(chainId)
  const chain = isSupportedChain ? toGraphQLChain(chainId) : Chain.Ethereum

  const {
    data: ringExploreStatsData,
    loading: ringExploreStatsLoading,
    error: ringExploreStatsError,
  } = useRingExploreStatsQuery(chain)
  const {
    data: ringProtocolStatsData,
    loading: ringProtocolStatsLoading,
    error: ringProtocolStatsError,
  } = useRingProtocolStatsQuery(chain)

  const {
    data: exploreStatsData,
    isLoading: exploreStatsLoading,
    error: exploreStatsError,
  } = useExploreStatsQuery({
    chainId: isSupportedChain ? chainId?.toString() : UniverseChainId.Mainnet.toString(),
  })
  const {
    data: protocolStatsData,
    isLoading: protocolStatsLoading,
    error: protocolStatsError,
  } = useProtocolStatsQuery({
    chainId: isSupportedChain ? chainId?.toString() : UniverseChainId.Mainnet.toString(),
  })

  const exploreContext = useMemo(() => {
    return {
      exploreStats: {
        data: exploreStatsData,
        isLoading: exploreStatsLoading,
        error: !!exploreStatsError,
      },
      protocolStats: {
        data: protocolStatsData,
        isLoading: protocolStatsLoading,
        error: !!protocolStatsError,
      },
      ringExploreStats: {
        data: ringExploreStatsData, // top pools data
        isLoading: ringExploreStatsLoading,
        error: !!ringExploreStatsError,
      },
      ringProtocolStats: {
        data: ringProtocolStatsData,
        isLoading: ringProtocolStatsLoading,
        error: !!ringProtocolStatsError,
      },
    }
  }, [
    exploreStatsData,
    exploreStatsError,
    exploreStatsLoading,
    protocolStatsData,
    protocolStatsError,
    protocolStatsLoading,
    ringExploreStatsData,
    ringExploreStatsError,
    ringExploreStatsLoading,
    ringProtocolStatsData,
    ringProtocolStatsError,
    ringProtocolStatsLoading,
  ])
  return <ExploreContext.Provider value={exploreContext}>{children}</ExploreContext.Provider>
}
