import { UNIVERSAL_ROUTER_ADDRESS } from '@uniswap/universal-router-sdk'
import { SupportedInterfaceChainId } from 'constants/chains'
import { useNftUniversalRouterAddressQuery } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { UniverseChainId } from 'uniswap/src/types/chains'

export function getURAddress(chainId?: SupportedInterfaceChainId, nftURAddress?: string): string | undefined {
  if (!chainId) {
    return undefined
  }
  // if mainnet and on NFT flow, use the contract address returned by GQL
  if (chainId === UniverseChainId.Mainnet) {
    return nftURAddress ?? UNIVERSAL_ROUTER_ADDRESS(chainId)
  }
  return UNIVERSAL_ROUTER_ADDRESS(chainId)
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
