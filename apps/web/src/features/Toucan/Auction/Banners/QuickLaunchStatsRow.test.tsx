import type { PlainMessage } from '@bufbuild/protobuf'
import type { Checkpoint } from '@uniswap/client-launches/dist/data/v1/auction_pb'
import { UniverseChainId } from '@universe/chains'
import { PropsWithChildren } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { QuickLaunchStatsRow } from '~/features/Toucan/Auction/Banners/QuickLaunchStatsRow'
import { AuctionStoreContext } from '~/features/Toucan/Auction/store/AuctionStoreContext'
import { createAuctionStore } from '~/features/Toucan/Auction/store/createAuctionStore'
import { AuctionCheckpointLoadState, AuctionDetails, AuctionOutcome } from '~/features/Toucan/Auction/store/types'
import { render, screen } from '~/test-utils/render'

// Banner numbers come from a clearing-price query that never resolves in jsdom; stub them as
// loaded so the time-remaining cell renders its value instead of the skeleton.
vi.mock('~/features/Toucan/Auction/hooks/useStatsBannerData', () => ({
  useStatsBannerData: () => ({
    bidTokenInfo: undefined,
    currentValuationFormatted: '--',
    currentValuationFiatFormatted: '--',
    currencyRaisedFormatted: '--',
    hasData: true,
  }),
}))

const AUCTION_ADDRESS = '0xd84a1a89b1403c863ae0fa1c9a241c0480cdca1b'
const START_BLOCK = '1000'
const END_BLOCK = '2000'
const ENDED_BLOCK = 2_100
const LIVE_BLOCK = 1_500
const REQUIRED_CURRENCY_RAISED = '2000000000000000000'
const RAISED_ABOVE_TARGET = '5000000000000000000'
const RAISED_BELOW_TARGET = '1000000000000000000'

const FDV_AT_LAUNCH = 'FDV at launch'
const FINAL_FDV = 'Final FDV'
const CURRENT_FDV = 'Current FDV'
const LAUNCHED = 'Launched'
const FAILED_TO_LAUNCH = 'Failed to launch'
const ENDED = 'Ended'

function renderRow({
  blockNumber,
  currencyRaised,
  checkpointLoadState,
}: {
  blockNumber: number
  currencyRaised: string | undefined
  checkpointLoadState: AuctionCheckpointLoadState
}): AuctionOutcome {
  const store = createAuctionStore(AUCTION_ADDRESS, UniverseChainId.Mainnet)
  const { actions } = store.getState()
  actions.setAuctionDetails({
    address: AUCTION_ADDRESS,
    chainId: UniverseChainId.Mainnet,
    startBlock: START_BLOCK,
    endBlock: END_BLOCK,
    requiredCurrencyRaised: REQUIRED_CURRENCY_RAISED,
  } as AuctionDetails)
  actions.setCheckpointData(currencyRaised === undefined ? null : ({ currencyRaised } as PlainMessage<Checkpoint>))
  actions.setCheckpointLoadState(checkpointLoadState)
  actions.setCurrentBlockNumberAndUpdateProgress(blockNumber)

  function Wrapper({ children }: PropsWithChildren) {
    return <AuctionStoreContext.Provider value={store}>{children}</AuctionStoreContext.Provider>
  }

  render(
    <Wrapper>
      <QuickLaunchStatsRow />
    </Wrapper>,
  )

  return store.getState().progress.outcome
}

describe('QuickLaunchStatsRow ended state', () => {
  it('says "Failed to launch" for an ended auction that missed its graduation threshold', () => {
    const outcome = renderRow({
      blockNumber: ENDED_BLOCK,
      currencyRaised: RAISED_BELOW_TARGET,
      checkpointLoadState: AuctionCheckpointLoadState.Success,
    })

    expect(outcome).toBe(AuctionOutcome.FAILED)
    expect(screen.getByText(FAILED_TO_LAUNCH)).toBeInTheDocument()
    expect(screen.queryByText(LAUNCHED)).toBeNull()
  })

  it('says "Failed to launch" for an ended auction whose checkpoint settled empty (nothing raised)', () => {
    const outcome = renderRow({
      blockNumber: ENDED_BLOCK,
      currencyRaised: undefined,
      checkpointLoadState: AuctionCheckpointLoadState.Success,
    })

    expect(outcome).toBe(AuctionOutcome.FAILED)
    expect(screen.getByText(FAILED_TO_LAUNCH)).toBeInTheDocument()
    expect(screen.queryByText(LAUNCHED)).toBeNull()
  })

  it('says "Launched" for an ended auction that graduated', () => {
    const outcome = renderRow({
      blockNumber: ENDED_BLOCK,
      currencyRaised: RAISED_ABOVE_TARGET,
      checkpointLoadState: AuctionCheckpointLoadState.Success,
    })

    expect(outcome).toBe(AuctionOutcome.GRADUATED)
    expect(screen.getByText(LAUNCHED)).toBeInTheDocument()
    expect(screen.queryByText(FAILED_TO_LAUNCH)).toBeNull()
  })

  it('claims neither outcome while the final checkpoint is still loading', () => {
    const outcome = renderRow({
      blockNumber: ENDED_BLOCK,
      currencyRaised: undefined,
      checkpointLoadState: AuctionCheckpointLoadState.Loading,
    })

    expect(outcome).toBe(AuctionOutcome.UNKNOWN)
    expect(screen.getByText(ENDED)).toBeInTheDocument()
    expect(screen.queryByText(LAUNCHED)).toBeNull()
    expect(screen.queryByText(FAILED_TO_LAUNCH)).toBeNull()
  })

  it('shows no terminal label while the auction is live', () => {
    const outcome = renderRow({
      blockNumber: LIVE_BLOCK,
      currencyRaised: RAISED_BELOW_TARGET,
      checkpointLoadState: AuctionCheckpointLoadState.Success,
    })

    expect(outcome).toBe(AuctionOutcome.ACTIVE)
    expect(screen.queryByText(LAUNCHED)).toBeNull()
    expect(screen.queryByText(FAILED_TO_LAUNCH)).toBeNull()
    expect(screen.queryByText(ENDED)).toBeNull()
  })
})

describe('QuickLaunchStatsRow valuation label', () => {
  it('says "Final FDV", not "FDV at launch", for an ended auction that failed', () => {
    renderRow({
      blockNumber: ENDED_BLOCK,
      currencyRaised: RAISED_BELOW_TARGET,
      checkpointLoadState: AuctionCheckpointLoadState.Success,
    })

    expect(screen.getByText(FINAL_FDV)).toBeInTheDocument()
    expect(screen.queryByText(FDV_AT_LAUNCH)).toBeNull()
  })

  it('says "FDV at launch" for an ended auction that graduated', () => {
    renderRow({
      blockNumber: ENDED_BLOCK,
      currencyRaised: RAISED_ABOVE_TARGET,
      checkpointLoadState: AuctionCheckpointLoadState.Success,
    })

    expect(screen.getByText(FDV_AT_LAUNCH)).toBeInTheDocument()
    expect(screen.queryByText(FINAL_FDV)).toBeNull()
  })

  it('does not claim a launch FDV while the outcome is undecided', () => {
    renderRow({
      blockNumber: ENDED_BLOCK,
      currencyRaised: undefined,
      checkpointLoadState: AuctionCheckpointLoadState.Loading,
    })

    expect(screen.getByText(FINAL_FDV)).toBeInTheDocument()
    expect(screen.queryByText(FDV_AT_LAUNCH)).toBeNull()
  })

  it('says "Current FDV" while the auction is live', () => {
    renderRow({
      blockNumber: LIVE_BLOCK,
      currencyRaised: RAISED_BELOW_TARGET,
      checkpointLoadState: AuctionCheckpointLoadState.Success,
    })

    expect(screen.getByText(CURRENT_FDV)).toBeInTheDocument()
  })
})
