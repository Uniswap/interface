import { useMemo } from 'react'
import { EVMUniverseChainId } from 'uniswap/src/features/chains/types'
import { useReadContract } from 'wagmi'
import { useAuctionStore } from '~/features/Toucan/Auction/store/useAuctionStore'
import { getAuctionRedemptionConfig } from '~/features/Toucan/Config/config'
import { assume0xAddress } from '~/utils/wagmi'

// Minimal IVirtualERC20 surface — just the underlying-token getter we need.
// Mirrors ../liquidity-launcher/src/interfaces/external/IVirtualERC20.sol
const virtualErc20Abi = [
  {
    type: 'function',
    name: 'UNDERLYING_TOKEN_ADDRESS',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'address' }],
  },
] as const

export interface AuctionRedemption {
  /** Whether the auctioned token is a virtual token now redeemable for a real, tradeable one. */
  isRedeemable: boolean
  /** External page to redeem on. Defined whenever `isRedeemable` is true. */
  redeemUrl: string | undefined
  /** Real (underlying) token address, read on-chain. Undefined until the read resolves. */
  realTokenAddress: string | undefined
  /** Chain of the auction — and of the real token (the on-chain underlying). */
  chainId: EVMUniverseChainId | undefined
  /** True while the on-chain underlying-token read is in flight. */
  loading: boolean
}

/**
 * Resolves whether the current auction's (virtual) token is redeemable for a real token, plus
 * where to redeem and which real token to point at.
 *
 * Today the "is redeemable" flag and redeem URL come from a local config override
 * (`getAuctionRedemptionConfig`), and the real token address is read on-chain from the virtual
 * token's `UNDERLYING_TOKEN_ADDRESS()`. This hook is the single seam for that: when the backend
 * starts serving redemption state on the `Auction` type, only this hook changes — the banner and
 * graduated card keep consuming the same shape.
 */
export function useAuctionRedemption(): AuctionRedemption {
  const auctionDetails = useAuctionStore((state) => state.auctionDetails)
  const chainId = auctionDetails?.chainId
  const virtualTokenAddress = auctionDetails?.tokenAddress

  const config = useMemo(
    () =>
      chainId && virtualTokenAddress
        ? getAuctionRedemptionConfig({ chainId, tokenAddress: virtualTokenAddress })
        : undefined,
    [chainId, virtualTokenAddress],
  )
  const isRedeemable = Boolean(config)

  const { data: underlyingAddress, isLoading } = useReadContract({
    address: assume0xAddress(virtualTokenAddress),
    chainId,
    abi: virtualErc20Abi,
    functionName: 'UNDERLYING_TOKEN_ADDRESS',
    // Underlying address is immutable; only read it for known-redeemable (virtual) tokens.
    query: { enabled: isRedeemable && Boolean(virtualTokenAddress && chainId), staleTime: Infinity },
  })

  return useMemo(
    () => ({
      isRedeemable,
      redeemUrl: config?.redeemUrl,
      realTokenAddress: underlyingAddress,
      chainId,
      loading: isRedeemable && isLoading,
    }),
    [isRedeemable, config?.redeemUrl, underlyingAddress, chainId, isLoading],
  )
}
