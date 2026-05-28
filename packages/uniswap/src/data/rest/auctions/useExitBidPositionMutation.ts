import { type PartialMessage } from '@bufbuild/protobuf'
import { UseMutationResult, useMutation } from '@tanstack/react-query'
import type {
  ExitBidPositionRequest,
  ExitBidPositionResponse,
} from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/auction_pb'
import { AuctionMutationClient } from 'uniswap/src/data/apiClients/liquidityService/AuctionMutationClient'

/**
 * Hook to exit a single bid position (refund) without claiming tokens.
 *
 * This hook is used for the pre-claim window scenario where:
 * - The auction has graduated (ended successfully)
 * - The claim period has not yet started
 * - The user has an out-of-range bid that needs refunding
 *
 * Unlike exitBidAndClaimTokens, this API only handles a single bid exit
 * and does not include token claiming logic.
 *
 * @example
 * ```tsx
 * const exitBidPositionMutation = useExitBidPositionMutation()
 *
 * const handleRefund = async () => {
 *   try {
 *     const result = await exitBidPositionMutation.mutateAsync({
 *       bidId: 'bid-123',
 *       auctionContractAddress: '0x...',
 *       chainId: ChainId.BASE,
 *       walletAddress: '0x...',
 *     })
 *     console.log('Bid exited:', result)
 *   } catch (error) {
 *     console.error('Failed to exit bid:', error)
 *   }
 * }
 * ```
 *
 * @returns A mutation object from @tanstack/react-query with methods to exit a single bid
 */
export function useExitBidPositionMutation(): UseMutationResult<
  ExitBidPositionResponse,
  Error,
  PartialMessage<ExitBidPositionRequest>
> {
  return useMutation({
    mutationFn: (request) =>
      AuctionMutationClient.exitBidPosition({
        ...request,
        simulateTransaction: true,
      }),
  })
}
