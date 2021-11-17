import { ApolloClient, NormalizedCacheObject } from '@apollo/client'
import { useActiveWeb3React } from '.'
import { carrotSubgraphClient } from '../apollo/client'

export function useCarrotSubgraphClient(): ApolloClient<NormalizedCacheObject> | undefined {
  const { chainId } = useActiveWeb3React()
  return chainId ? carrotSubgraphClient[chainId] : undefined
}
