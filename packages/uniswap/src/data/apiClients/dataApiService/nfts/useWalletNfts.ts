import { useInfiniteQuery } from '@tanstack/react-query'
import { useCallback, useMemo } from 'react'
import { getGetWalletNftsQueryOptions } from 'uniswap/src/data/apiClients/dataApiService/nfts/queries'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { toSupportedChainId } from 'uniswap/src/features/chains/utils'
import type { UseWalletNftsProps, UseWalletNftsResult } from 'uniswap/src/features/nfts/hooks/types'
import { NFTItem } from 'uniswap/src/features/nfts/types'
import { logger } from 'utilities/src/logger/logger'

const DEFAULT_PAGE_SIZE = 100

export function useWalletNfts({
  address,
  filterSpam = false,
  skip,
  chainsFilter,
  pollInterval,
  pageSize,
}: UseWalletNftsProps): UseWalletNftsResult {
  const { chains } = useEnabledChains()
  const { data, isLoading, isPending, isError, fetchNextPage, hasNextPage, refetch, isFetchingNextPage } =
    useInfiniteQuery({
      ...getGetWalletNftsQueryOptions({
        params: {
          ownerAddress: address,
          includeSpam: !filterSpam,
          chainIds: chainsFilter ?? chains,
          pageSize: pageSize ?? DEFAULT_PAGE_SIZE,
        },
        refetchInterval: pollInterval,
      }),
      enabled: !skip,
    })

  const fetchNextPageWrapper = useCallback(async () => {
    fetchNextPage().catch(() => {
      logger.warn('dataApiService', 'useWalletNfts', 'Failed to fetch next page of NFTs')
    })
  }, [fetchNextPage])

  const nfts = useMemo(() => {
    const rawData = data?.pages.flatMap((page) => page.nfts) ?? []
    const nftItems = rawData.map(
      (nft): NFTItem => ({
        chainId: toSupportedChainId(nft.chainId) ?? undefined,
        name: nft.name,
        description: nft.description,
        contractAddress: nft.contractAddress,
        tokenId: nft.tokenId,
        imageUrl: nft.image?.url,
        imageDimensions:
          nft.image?.width && nft.image.height ? { width: nft.image.width, height: nft.image.height } : undefined,
        thumbnailUrl: nft.thumbnail?.url,
        collectionName: nft.collectionName,
        isSpam: nft.isSpam,
      }),
    )
    return nftItems
  }, [data?.pages])

  return {
    nfts,
    loading: isLoading,
    isFetchingMore: isFetchingNextPage,
    hasNextPage,
    isPending,
    isError,
    fetchNextPage: fetchNextPageWrapper,
    refetch,
  }
}
