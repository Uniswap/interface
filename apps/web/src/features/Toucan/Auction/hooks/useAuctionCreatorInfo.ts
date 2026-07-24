import { useActiveAddress } from 'uniswap/src/features/accounts/store/hooks'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { useAuctionStore } from '~/features/Toucan/Auction/store/useAuctionStore'
import { isTokensRecipient } from '~/features/Toucan/Auction/utils/creatorActions'

export interface AuctionCreatorInfo {
  // The address that created the auction (data-api creator_address)
  creatorAddress: string | undefined
  // The address allowed to call sweepUnsoldTokens() (data-api tokens_recipient)
  tokensRecipient: string | undefined
  // Whether the connected wallet is the tokensRecipient — gates the creator sweep flow
  isConnectedTokensRecipient: boolean
}

/**
 * Creator identity for the current auction. Sweep gating uses tokensRecipient (the on-chain
 * permission), not creatorAddress — the two can differ when a creator launches on behalf of
 * another recipient.
 */
export function useAuctionCreatorInfo(): AuctionCreatorInfo {
  const connectedAddress = useActiveAddress(Platform.EVM)
  const { creatorAddress, tokensRecipient } = useAuctionStore((state) => ({
    creatorAddress: state.auctionDetails?.creatorAddress,
    tokensRecipient: state.auctionDetails?.tokensRecipient,
  }))

  return {
    creatorAddress,
    tokensRecipient,
    isConnectedTokensRecipient: isTokensRecipient({ connectedAddress: connectedAddress ?? undefined, tokensRecipient }),
  }
}
