import { ExploreStatsResponse, ProtocolStatsResponse } from '@uniswap/client-explore/dist/uniswap/explore/v1/service_pb'
import { ALL_NETWORKS_ARG } from '@universe/api'
import { createContext, useMemo } from 'react'
import { useExploreStatsQuery } from 'uniswap/src/data/rest/exploreStats'
import { useProtocolStatsQuery } from 'uniswap/src/data/rest/protocolStats'
import { useIsSupportedChainId } from 'uniswap/src/features/chains/hooks/useSupportedChainId'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

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

  const {
    data: exploreStatsData,
    isLoading: exploreStatsLoading,
    error: exploreStatsError,
  } = useExploreStatsQuery<ExploreStatsResponse>({
    input: { chainId: isSupportedChain ? chainId.toString() : ALL_NETWORKS_ARG },
  })
  const {
    data: protocolStatsData,
    isLoading: protocolStatsLoading,
    error: protocolStatsError,
  } = useProtocolStatsQuery({
    chainId: isSupportedChain ? chainId.toString() : ALL_NETWORKS_ARG,
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
    }
  }, [
    exploreStatsData,
    exploreStatsError,
    exploreStatsLoading,
    protocolStatsData,
    protocolStatsError,
    protocolStatsLoading,
  ])
  return <ExploreContext.Provider value={exploreContext}>{children}</ExploreContext.Provider>
}
