import type { PlainMessage } from '@bufbuild/protobuf'
import { useQuery } from '@tanstack/react-query'
import type { Auction, GetAuctionResponse } from '@uniswap/client-data-api/dist/data/v1/auction_pb'
import type { UniverseChainId } from '@universe/chains'
import { FeatureFlags, useFeatureFlag, useStatsigClientStatus } from '@universe/gating'
import { useMemo } from 'react'
import { isHiddenAuction } from 'uniswap/src/features/toucan/hiddenAuctions'
import { TokenDetailsSourceState } from '~/pages/TokenDetails/context/tokenDetailsSourceState'
import { getTdpAuctionQueryOptions, getTdpAuctionRequest } from '~/pages/TokenDetails/tdpAuctionQueryOptions'

export type TokenDetailsAuctionSource =
  | { status: TokenDetailsSourceState.Disabled | TokenDetailsSourceState.Loading | TokenDetailsSourceState.NotFound }
  | { status: TokenDetailsSourceState.Found; auction: PlainMessage<Auction>; auctions: PlainMessage<Auction>[] }
  | { status: TokenDetailsSourceState.Error; error: Error }

type UseTokenDetailsAuctionParams = {
  chainId: UniverseChainId
  tokenAddress: string
  isNative: boolean
}

function resolveTokenDetailsAuctionSource({
  enabled,
  waitingForFlags,
  data,
  error,
  isSuccess,
}: {
  enabled: boolean
  waitingForFlags: boolean
  data: PlainMessage<GetAuctionResponse> | undefined
  error: Error | null
  isSuccess: boolean
}): TokenDetailsAuctionSource {
  if (!enabled) {
    return {
      status: waitingForFlags ? TokenDetailsSourceState.Loading : TokenDetailsSourceState.Disabled,
    }
  }

  // Backend order is preserved; index 0 is treated as the page's primary auction.
  const auctions = data?.auctions.filter((candidate) => !isHiddenAuction({ auctionId: candidate.auctionId })) ?? []
  const auction = auctions.at(0)
  if (auction) {
    return { status: TokenDetailsSourceState.Found, auction, auctions }
  }

  if (error) {
    return { status: TokenDetailsSourceState.Error, error }
  }

  if (isSuccess) {
    return { status: TokenDetailsSourceState.NotFound }
  }

  return { status: TokenDetailsSourceState.Loading }
}

export function useTokenDetailsAuction({
  chainId,
  tokenAddress,
  isNative,
}: UseTokenDetailsAuctionParams): TokenDetailsAuctionSource {
  const featureEnabled = useFeatureFlag(FeatureFlags.TokenProvenance)
  const { isStatsigReady } = useStatsigClientStatus()
  const params = useMemo(
    () => getTdpAuctionRequest({ chainId, tokenAddress, isNative }),
    [chainId, isNative, tokenAddress],
  )
  const enabled = isStatsigReady && featureEnabled && params !== undefined
  const waitingForFlags = !isStatsigReady && params !== undefined
  const { data, error, isSuccess } = useQuery(getTdpAuctionQueryOptions({ params, enabled }))

  return useMemo(
    () =>
      resolveTokenDetailsAuctionSource({
        enabled,
        waitingForFlags,
        data,
        error,
        isSuccess,
      }),
    [data, enabled, error, isSuccess, waitingForFlags],
  )
}
