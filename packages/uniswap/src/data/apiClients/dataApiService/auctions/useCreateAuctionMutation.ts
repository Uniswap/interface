import { type PartialMessage } from '@bufbuild/protobuf'
import { UseMutationResult, useMutation } from '@tanstack/react-query'
import type {
  CreateAuctionRequest,
  CreateAuctionResponse,
} from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/auction_pb'
import { AuctionMutationClient } from 'uniswap/src/data/apiClients/liquidityService/AuctionMutationClient'

/**
 * Hook to create (launch) an auction via the liquidity service.
 *
 * The backend owns the user-friendly -> contract-native translation: it takes the
 * wizard-level inputs (timestamps, canonical floor price, percentages, fee tier,
 * range strategy), validates them, and returns the calldata transaction(s) to sign
 * plus the predicted token/auction addresses.
 *
 * @example
 * ```tsx
 * const createAuctionMutation = useCreateAuctionMutation()
 * const result = await createAuctionMutation.mutateAsync(request)
 * // result.transactions, result.predictedTokenAddress, result.predictedAuctionAddress
 * ```
 */
export function useCreateAuctionMutation(): UseMutationResult<
  CreateAuctionResponse,
  Error,
  PartialMessage<CreateAuctionRequest>
> {
  return useMutation({
    mutationFn: (request) =>
      AuctionMutationClient.createAuction({
        ...request,
      }),
  })
}
