import type { PartialMessage } from '@bufbuild/protobuf'
import type { VerifyWalletRequest } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/auction_pb'
import { UniverseChainId } from '@universe/chains'
import { useMemo } from 'react'
import { buildVerifyWalletParams } from 'uniswap/src/data/apiClients/dataApiService/auctions/useVerifyWallet'
import { useActiveAddress } from '~/connection/accounts/hooks'
import { useAuctionStore } from '~/features/Toucan/Auction/store/useAuctionStore'

/**
 * The VerifyWallet request params for the current auction, derived in one place.
 *
 * The entire params object is the react-query key, so the KYC status hook and the
 * max-bid-price hook share a cache entry only if their params match by VALUE, not merely by
 * field shape. Deriving the values here — rather than in each consumer — keeps the two
 * subscriptions on one cache entry instead of issuing two VerifyWallet requests per auction
 * page view.
 *
 * Worth knowing: BidForm holds the auction address under two names (`auctionAddress` and
 * `auctionContractAddress`), so hand-assembling these params at a call site is an easy way
 * to drift without noticing.
 */
export function useVerifyWalletParams(): PartialMessage<VerifyWalletRequest> {
  const { auctionAddress, chainId } = useAuctionStore((state) => ({
    auctionAddress: state.auctionAddress,
    chainId: state.auctionDetails?.chainId,
  }))
  const walletAddress = useActiveAddress(chainId ?? UniverseChainId.Sepolia)

  return useMemo(
    () => buildVerifyWalletParams({ walletAddress, auctionAddress, chainId }),
    [walletAddress, auctionAddress, chainId],
  )
}
