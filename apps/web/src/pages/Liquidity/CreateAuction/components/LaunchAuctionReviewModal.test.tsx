import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { vi } from 'vitest'
import { LaunchProgressStep } from '~/pages/Liquidity/CreateAuction/components/LaunchAuctionProgressIndicator'
import { LaunchAuctionReviewModal } from '~/pages/Liquidity/CreateAuction/components/LaunchAuctionReviewModal'
import type { AuctionTokenAmounts } from '~/pages/Liquidity/CreateAuction/types'
import { render, screen } from '~/test-utils/render'

// CreateAuctionTokenLogo reads from the create-auction store, which isn't mounted in this unit test.
vi.mock('~/pages/Liquidity/CreateAuction/components/CreateAuctionTokenLogo', () => ({
  CreateAuctionTokenLogo: () => null,
}))

const token = new Token(UniverseChainId.Mainnet, `0x${'1'.padStart(40, '0')}`, 18, 'TKN')
const amount = (raw: bigint): CurrencyAmount<Token> => CurrencyAmount.fromRawAmount(token, raw.toString())
const committed: AuctionTokenAmounts = {
  totalSupply: amount(10n ** 27n),
  auctionSupplyAmount: amount(10n ** 26n),
  postAuctionLiquidityAmount: amount(10n ** 25n),
}

function renderModal(
  overrides: Partial<React.ComponentProps<typeof LaunchAuctionReviewModal>> = {},
): ReturnType<typeof render> {
  return render(
    <LaunchAuctionReviewModal
      isOpen
      onClose={vi.fn()}
      tokenName="My Token"
      tokenSymbol="TKN"
      isNewToken
      committed={committed}
      feeTierDisplay="1%"
      raiseCurrencySymbol="USDC"
      progressSteps={[]}
      currentProgressStepIndex={-1}
      currentStepPending={false}
      isLaunching={false}
      isPreparing={false}
      onLaunchToken={vi.fn()}
      {...overrides}
    />,
  )
}

describe('LaunchAuctionReviewModal', () => {
  it('renders the step indicator for a multi-transaction launch (approve + launch)', () => {
    renderModal({
      progressSteps: [LaunchProgressStep.ApproveToken, LaunchProgressStep.PendingConfirmation],
      currentProgressStepIndex: 0,
    })

    expect(screen.getByTestId(TestID.LaunchAuctionProgressIndicator)).toBeInTheDocument()
  })

  it('does not render the step indicator for a single-transaction launch', () => {
    renderModal({
      progressSteps: [LaunchProgressStep.PendingConfirmation],
      currentProgressStepIndex: 0,
    })

    expect(screen.queryByTestId(TestID.LaunchAuctionProgressIndicator)).not.toBeInTheDocument()
  })

  it('does not render the step indicator before a launch is in progress', () => {
    renderModal({ progressSteps: [], currentProgressStepIndex: -1 })

    expect(screen.queryByTestId(TestID.LaunchAuctionProgressIndicator)).not.toBeInTheDocument()
  })

  it('keeps the launch button (not a step indicator) and disables it while CreateAuction prefetches', () => {
    renderModal({ isPreparing: true })

    expect(screen.queryByTestId(TestID.LaunchAuctionProgressIndicator)).not.toBeInTheDocument()
    expect(screen.getByTestId(TestID.LaunchAuctionConfirmButton)).toHaveAttribute('aria-disabled', 'true')
  })
})
