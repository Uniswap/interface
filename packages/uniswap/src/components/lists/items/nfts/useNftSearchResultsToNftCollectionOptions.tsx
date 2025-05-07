import { useMemo } from 'react'
import { NFTCollectionOption, OnchainItemListOptionType } from 'uniswap/src/components/lists/items/types'
import {
  Chain,
  CollectionSearchQuery,
  SearchPopularNftCollectionsQuery,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { fromGraphQLChain } from 'uniswap/src/features/chains/utils'

function gqlNFTToNFTCollectionOption(
  node: NonNullable<NonNullable<NonNullable<NonNullable<CollectionSearchQuery>['nftCollections']>['edges']>[0]>['node'],
): NFTCollectionOption | null {
  const contract = node?.nftContracts?.[0]
  // Only show NFT results that have fully populated results
  const chainId = fromGraphQLChain(contract?.chain ?? Chain.Ethereum)
  if (node.name && contract?.address && chainId) {
    return {
      type: OnchainItemListOptionType.NFTCollection,
      chainId,
      address: contract.address,
      name: node.name,
      imageUrl: node?.image?.url ?? null,
      isVerified: Boolean(node.isVerified),
    }
  }
  return null
}

export function useNftSearchResultsToNftCollectionOptions(
  nftSearchResultsData: CollectionSearchQuery | undefined,
  chainFilter: UniverseChainId | null,
): NFTCollectionOption[]
export function useNftSearchResultsToNftCollectionOptions(
  nftSearchResultsData: SearchPopularNftCollectionsQuery | undefined,
  chainFilter: UniverseChainId | null,
): NFTCollectionOption[] {
  return useMemo(() => {
    const collections = nftSearchResultsData
      ? 'nftCollections' in nftSearchResultsData
        ? (nftSearchResultsData.nftCollections as NonNullable<CollectionSearchQuery>['nftCollections'])
        : (nftSearchResultsData?.topCollections as NonNullable<SearchPopularNftCollectionsQuery>['topCollections'])
      : undefined
    if (!collections) {
      return []
    }

    return collections.edges.reduce<NFTCollectionOption[]>((acc, { node }) => {
      const option: NFTCollectionOption | null = gqlNFTToNFTCollectionOption(node)

      if (option && (chainFilter === null || option.chainId === chainFilter)) {
        acc.push(option)
      }
      return acc
    }, [] as NFTCollectionOption[]) as NFTCollectionOption[]
  }, [nftSearchResultsData, chainFilter])
}
