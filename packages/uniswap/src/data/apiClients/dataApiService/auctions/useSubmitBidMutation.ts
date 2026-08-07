import { type PartialMessage } from '@bufbuild/protobuf'
import { UseMutationResult, useMutation } from '@tanstack/react-query'
import type {
  SubmitBidRequest,
  SubmitBidResponse,
} from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/auction_pb'
import { AuctionMutationClient } from 'uniswap/src/data/apiClients/liquidityService/AuctionMutationClient'

/**
 * Hook to submit a bid to an auction
 *
 * @example
 * ```tsx
 * const submitBidMutation = useSubmitBidMutation()
 *
 * const handleSubmit = async () => {
 *   try {
 *     const result = await submitBidMutation.mutateAsync({
 *       maxPrice: '1000000',
 *       amount: '1000',
 *       walletAddress: '0x...',
 *       auctionContractAddress: '0x...',
 *       chainId: ChainId.BASE,
 *     })
 *     console.log('Bid submitted:', result)
 *   } catch (error) {
 *     console.error('Failed to submit bid:', error)
 *   }
 * }
 * ```
 *
 * @returns A mutation object from @tanstack/react-query with methods to submit bids
 */
export function useSubmitBidMutation(): UseMutationResult<SubmitBidResponse, Error, PartialMessage<SubmitBidRequest>> {
  return useMutation({
    mutationFn: (request) =>
      AuctionMutationClient.submitBid({
        ...request,
      }),
  })
}
