import { useMemo } from 'react'
import { getCreatorSweepDisplay } from '~/features/Toucan/Auction/CreatorActions/getCreatorSweepDisplay'
import { getMigrateCtaState } from '~/features/Toucan/Auction/CreatorActions/getMigrateCtaState'
import { useAuctionCreatorInfo } from '~/features/Toucan/Auction/hooks/useAuctionCreatorInfo'
import { useBidFormState } from '~/features/Toucan/Auction/hooks/useBidFormState'
import { useSweepUnsoldTokensState } from '~/features/Toucan/Auction/hooks/useSweepUnsoldTokensState'
import { useAuctionOutcome, useAuctionStore } from '~/features/Toucan/Auction/store/useAuctionStore'
import { getLbpMigrationState } from '~/features/Toucan/Auction/utils/creatorActions'
import { safeBigInt } from '~/features/Toucan/Auction/utils/safeBigInt'

interface PostAuctionPanelState {
  // A creator action card is showing: sweep-unsold-tokens (creator only) or the migrate CTA
  // (permissionless — visible to everyone once the migration block is reached).
  postAuctionActionVisible: boolean
  // The post-auction panel has real content for this viewer — a creator/migrate CTA or the
  // graduated success card. When false the ended state would only be the (now removed) disabled bid
  // frame, so the page collapses it behind the disabled "Auction Concluded" trigger instead.
  hasPanelContent: boolean
}

/**
 * Page-level mirror of what PostAuctionPanel renders, used by ToucanToken to decide whether the
 * mobile fixed button should be the disabled "Auction Concluded" trigger. The sweep/migrate
 * visibility here uses the same getCreatorSweepDisplay / getMigrateCtaState helpers as
 * CreatorSweepCard / MigrateCard, so the trigger never double-renders alongside a panel card.
 */
export function usePostAuctionPanelState(): PostAuctionPanelState {
  const { showAuctionGraduated } = useBidFormState()
  const outcome = useAuctionOutcome()
  const { auctionDetails, currentBlockNumber } = useAuctionStore((state) => ({
    auctionDetails: state.auctionDetails,
    currentBlockNumber: state.currentBlockNumber,
  }))
  const { isConnectedTokensRecipient } = useAuctionCreatorInfo()
  const { hasSwept, remainingSupplyRaw } = useSweepUnsoldTokensState({ enabled: isConnectedTokensRecipient })

  return useMemo(() => {
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
    const migrateVisible = getMigrateCtaState({
      outcome,
      migration,
      isConnectedTokensRecipient,
      hasLocallyMigrated: false,
    }).visible

    const postAuctionActionVisible = sweepVisible || migrateVisible
    return { postAuctionActionVisible, hasPanelContent: showAuctionGraduated || postAuctionActionVisible }
  }, [
    showAuctionGraduated,
    outcome,
    isConnectedTokensRecipient,
    hasSwept,
    remainingSupplyRaw,
    auctionDetails,
    currentBlockNumber,
  ])
}
