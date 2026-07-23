import { remainingSupplyCall, sweepUnsoldTokensBlockCall } from '@uniswap/liquidity-launcher-sdk'
import ms from 'ms'
import { useEffect } from 'react'
import { useReadContract } from 'wagmi'
import { AuctionOutcome } from '~/features/Toucan/Auction/store/types'
import {
  useAuctionOutcome,
  useAuctionStore,
  useAuctionStoreActions,
} from '~/features/Toucan/Auction/store/useAuctionStore'
import { hasSweptUnsoldTokens } from '~/features/Toucan/Auction/utils/creatorActions'
import { assume0xAddress } from '~/utils/wagmi'

/**
 * On-chain state gating the creator's sweepUnsoldTokens() flow, read through the SDK's
 * auction-instance descriptors:
 * - sweepUnsoldTokensBlock(): one-shot latch, 0 until the creator sweeps. Synced into the
 *   auction store (sweepUnsoldTokensBlock) so any consumer can derive swept-ness.
 * - remainingSupply(): the graduated-path sweep amount (a failed launch returns the full
 *   deposited supply instead, which comes from the Auction proto's total_supply).
 *
 * Reads only run once the auction has ended — the sweep is not callable before endBlock.
 */
export function useSweepUnsoldTokensState({ enabled = true }: { enabled?: boolean } = {}): {
  hasSwept: boolean | undefined
  remainingSupplyRaw: bigint | undefined
  refetchSweepBlock: () => void
} {
  const { auctionAddress, chainId } = useAuctionStore((state) => ({
    auctionAddress: state.auctionDetails?.address,
    chainId: state.auctionDetails?.chainId,
  }))
  const outcome = useAuctionOutcome()
  const { setSweepUnsoldTokensBlock } = useAuctionStoreActions()

  const isEnded = outcome === AuctionOutcome.FAILED || outcome === AuctionOutcome.GRADUATED
  const address = assume0xAddress(auctionAddress)
  const queryEnabled = Boolean(enabled && isEnded && address && chainId)

  // The published SDK types descriptors' functionName/args wide (string / readonly unknown[]),
  // which wagmi's useReadContract generics can't narrow — restate the literals over the spread.
  const { data: sweepBlockData, refetch: refetchSweepBlock } = useReadContract({
    ...sweepUnsoldTokensBlockCall(address ?? '0x'),
    functionName: 'sweepUnsoldTokensBlock',
    args: [],
    chainId,
    query: { enabled: queryEnabled, staleTime: ms('30s') },
  })

  const { data: remainingSupplyData } = useReadContract({
    ...remainingSupplyCall(address ?? '0x'),
    functionName: 'remainingSupply',
    args: [],
    chainId,
    query: { enabled: queryEnabled && outcome === AuctionOutcome.GRADUATED, staleTime: ms('30s') },
  })

  const sweepBlock = typeof sweepBlockData === 'bigint' ? sweepBlockData.toString() : undefined

  useEffect(() => {
    setSweepUnsoldTokensBlock(sweepBlock)
  }, [sweepBlock, setSweepUnsoldTokensBlock])

  return {
    hasSwept: hasSweptUnsoldTokens(sweepBlock),
    remainingSupplyRaw: typeof remainingSupplyData === 'bigint' ? remainingSupplyData : undefined,
    refetchSweepBlock,
  }
}
