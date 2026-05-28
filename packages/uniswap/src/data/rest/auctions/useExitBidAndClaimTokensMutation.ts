import { type PartialMessage } from '@bufbuild/protobuf'
import { UseMutationResult, useMutation } from '@tanstack/react-query'
import type {
  ExitBidAndClaimTokensRequest,
  ExitBidAndClaimTokensResponse,
} from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/auction_pb'
import { AuctionMutationClient } from 'uniswap/src/data/apiClients/liquidityService/AuctionMutationClient'

/**
 * Hook to exit bid positions and claim auction tokens in a single transaction.
 *
 * This hook handles the combined operation of exiting bids and claiming tokens.
 * It accepts an array of BidToExit objects where:
 * - `bidId`: The unique identifier of the bid
 * - `isExited`: Whether the bid has already been exited
 *   - `false` for bids with status "submitted" (not yet exited)
 *   - `true` for bids with status "exited" (already exited, tokens need claiming)
 *   - Bids with status "claimed" should be excluded from the array
 *
 * @example
 * ```tsx
 * const exitBidAndClaimTokensMutation = useExitBidAndClaimTokensMutation()
 *
 * const handleExitAndClaim = async () => {
 *   // Filter bids that need to be processed (exclude already claimed)
 *   const bidsToProcess = userBids
 *     .filter(bid => bid.status !== 'claimed')
 *     .map(bid => ({
 *       bidId: bid.id,
 *       isExited: bid.status === 'exited', // true if exited, false if submitted
 *     }))
 *
 *   try {
 *     const result = await exitBidAndClaimTokensMutation.mutateAsync({
 *       bids: bidsToProcess,
 *       auctionContractAddress: '0x...',
 *       chainId: ChainId.BASE,
 *       walletAddress: '0x...',
 *     })
 *     console.log('Bids exited and tokens claimed:', result)
 *   } catch (error) {
 *     console.error('Failed to exit and claim:', error)
 *   }
 * }
 * ```
 *
 * @returns A mutation object from @tanstack/react-query with methods to exit bids and claim tokens
 */
export function useExitBidAndClaimTokensMutation(): UseMutationResult<
  ExitBidAndClaimTokensResponse,
  Error,
  PartialMessage<ExitBidAndClaimTokensRequest>
> {
  return useMutation({
    mutationFn: (request) =>
      AuctionMutationClient.exitBidAndClaimTokens({
        ...request,
        simulateTransaction: true,
      }),
  })
}
