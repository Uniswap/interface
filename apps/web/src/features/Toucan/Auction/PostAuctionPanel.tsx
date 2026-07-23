import { Flex } from 'ui/src'
import { BidForm } from '~/features/Toucan/Auction/BidForm/BidForm'
import { AuctionGraduated } from '~/features/Toucan/Auction/Bids/AuctionGraduated'
import { CreatorSweepCard } from '~/features/Toucan/Auction/CreatorActions/CreatorSweepCard'
import { getCreatorSweepDisplay } from '~/features/Toucan/Auction/CreatorActions/getCreatorSweepDisplay'
import { getMigrateCtaState } from '~/features/Toucan/Auction/CreatorActions/getMigrateCtaState'
import { MigrateCard } from '~/features/Toucan/Auction/CreatorActions/MigrateCard'
import { useAuctionCreatorInfo } from '~/features/Toucan/Auction/hooks/useAuctionCreatorInfo'
import { useBidFormState } from '~/features/Toucan/Auction/hooks/useBidFormState'
import { useSweepUnsoldTokensState } from '~/features/Toucan/Auction/hooks/useSweepUnsoldTokensState'
import { useAuctionOutcome, useAuctionStore } from '~/features/Toucan/Auction/store/useAuctionStore'
import { getLbpMigrationState } from '~/features/Toucan/Auction/utils/creatorActions'
import { safeBigInt } from '~/features/Toucan/Auction/utils/safeBigInt'

/**
 * The right-panel content once the auction has ended. A creator action card (sweep-unsold-tokens or
 * the migrate CTA) takes priority, so when the connected wallet has one, the bid form is hidden and
 * only that card shows. Otherwise the graduated success card (bidder with bids in a graduated
 * auction) or the concluded bid form is shown — the bid form doubles as the default "auction
 * concluded" state for everyone else. Rendered in the desktop right panel and, on mobile/tablet,
 * above the chart.
 */
export function PostAuctionPanel(): JSX.Element {
  const { showAuctionGraduated, hasUserBids } = useBidFormState()
  const outcome = useAuctionOutcome()
  const { auctionDetails, currentBlockNumber } = useAuctionStore((state) => ({
    auctionDetails: state.auctionDetails,
    currentBlockNumber: state.currentBlockNumber,
  }))
  const { isConnectedTokensRecipient } = useAuctionCreatorInfo()
  const { hasSwept, remainingSupplyRaw } = useSweepUnsoldTokensState({ enabled: isConnectedTokensRecipient })

  const sweepVisible =
    getCreatorSweepDisplay({
      outcome,
      isConnectedTokensRecipient,
      hasSwept,
      depositedSupplyRaw: safeBigInt(auctionDetails?.totalSupply) ?? undefined,
      remainingSupplyRaw,
    }) !== null

  const migration = getLbpMigrationState({
    lbpStrategyAddress: auctionDetails?.lbpStrategyAddress,
    lbpMigrationBlock: auctionDetails?.lbpMigrationBlock,
    lbpMigrationTxHash: auctionDetails?.lbpMigrationTxHash,
    currentBlockNumber,
  })
  // Data-driven visibility (no in-session override) mirrors what MigrateCard renders, since the
  // migrate submit optimistically sets lbp_migration_tx_hash on confirm.
  const migrateVisible = getMigrateCtaState({
    outcome,
    migration,
    isConnectedTokensRecipient,
    hasLocallyMigrated: false,
  }).visible

  // Keep the concluded bid form as the default, but hide it when a creator action card (sweep or
  // migrate) is present, so a creator who never bid sees only that card. Bidders keep their bid form.
  const showBidForm = !showAuctionGraduated && (hasUserBids || !(sweepVisible || migrateVisible))

  return (
    <Flex gap="$spacing24">
      {showAuctionGraduated ? <AuctionGraduated /> : showBidForm ? <BidForm /> : null}
      <CreatorSweepCard />
      <MigrateCard />
    </Flex>
  )
}
