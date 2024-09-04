// eslint-disable-next-line no-restricted-imports
import { ExploreStatsResponse, ProtocolStatsResponse } from '@uniswap/client-explore/dist/uniswap/explore/v1/service_pb'
import { createContext, useMemo } from 'react'
import { ALL_NETWORKS_ARG } from 'uniswap/src/data/rest'
import { useExploreStatsQuery } from 'uniswap/src/data/rest/exploreStats'
import { useProtocolStatsQuery } from 'uniswap/src/data/rest/protocolStats'
import { UniverseChainId } from 'uniswap/src/types/chains'

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

export function ExploreContextProvider({
  chainId,
  children,
}: {
  chainId?: UniverseChainId
  children: React.ReactNode
}) {
  const {
    data: exploreStatsData,
    isLoading: exploreStatsLoading,
    error: exploreStatsError,
  } = useExploreStatsQuery({
    chainId: chainId ? chainId.toString() : ALL_NETWORKS_ARG,
  })
  const {
    data: protocolStatsData,
    isLoading: protocolStatsLoading,
    error: protocolStatsError,
  } = useProtocolStatsQuery({
    chainId: chainId ? chainId.toString() : ALL_NETWORKS_ARG,
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
