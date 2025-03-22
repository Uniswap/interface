import { UNIVERSAL_ROUTER_ADDRESS, UniversalRouterVersion } from '@uniswap/universal-router-sdk'
import { useNftUniversalRouterAddressQuery } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

export function getURAddress(chainId?: UniverseChainId, nftURAddress?: string): string | undefined {
  if (!chainId) {
    return undefined
  }
  // if mainnet and on NFT flow, use the contract address returned by GQL
  if (chainId === UniverseChainId.Mainnet) {
    return nftURAddress ?? UNIVERSAL_ROUTER_ADDRESS(UniversalRouterVersion.V1_2, chainId)
  }
  return UNIVERSAL_ROUTER_ADDRESS(UniversalRouterVersion.V1_2, chainId)
}

export function useNftUniversalRouterAddress() {
  const { data, loading } = useNftUniversalRouterAddressQuery({
    // no cache because a different version of nftRoute query is going to be called around the same time
    fetchPolicy: 'no-cache',
  })

  return {
    universalRouterAddress: data?.nftRoute?.toAddress,
    universalRouterAddressIsLoading: loading,
  }
}
