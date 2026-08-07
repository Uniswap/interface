import { Flex } from 'ui/src'
import { AuctionGraduated } from '~/features/Toucan/Auction/Bids/AuctionGraduated'
import { CreatorSweepCard } from '~/features/Toucan/Auction/CreatorActions/CreatorSweepCard'
import { MigrateCard } from '~/features/Toucan/Auction/CreatorActions/MigrateCard'
import { useBidFormState } from '~/features/Toucan/Auction/hooks/useBidFormState'

/**
 * The panel shown once the auction has ended, in the desktop right panel and (on mobile/tablet)
 * above the chart. It renders ONLY when there is real content for this viewer:
 * - the graduated success card (a bidder with bids in a graduated auction), or
 * - a creator action card — sweep-unsold-tokens, or the (permissionless) migrate CTA.
 *
 * It deliberately never renders the bid form: an ended auction must not show the disabled
 * "auction concluded" bid frame inline (LP-1307). When none of the above apply the panel is empty
 * and the page shows the collapsed disabled "Auction Concluded" fixed button on mobile instead
 * (see ToucanToken/index.tsx). CreatorSweepCard and MigrateCard self-gate to null when they don't
 * apply to the viewer.
 */
export function PostAuctionPanel(): JSX.Element {
  const { showAuctionGraduated } = useBidFormState()

  return (
    <Flex gap="$spacing24">
      {showAuctionGraduated && <AuctionGraduated />}
      <CreatorSweepCard />
      <MigrateCard />
    </Flex>
  )
}
