import { UniverseChainId } from '@universe/chains'
import { describe, expect, it, vi } from 'vitest'
import { zeroAddress } from '~/chains'
import { RaiseCurrency } from '~/features/Toucan/utils/raiseCurrency'
import { ReviewLaunchStep } from '~/pages/Liquidity/CreateAuction/steps/ReviewLaunchStep'
import { CreateAuctionStoreContext } from '~/pages/Liquidity/CreateAuction/store/CreateAuctionStoreContext'
import { createCreateAuctionStore } from '~/pages/Liquidity/CreateAuction/store/createCreateAuctionStore'
import { getPrimaryStablecoin } from '~/pages/Liquidity/CreateAuction/utils'
import { render, screen } from '~/test-utils/render'

// Hoisted so the currency-info mock below can label the two slots distinguishably: on a
// same-token chain the two raise options otherwise share a symbol, hiding a mismatch.
const { NATIVE_SLOT_SYMBOL, STABLECOIN_SLOT_SYMBOL } = vi.hoisted(() => ({
  NATIVE_SLOT_SYMBOL: 'NATIVE-SLOT',
  STABLECOIN_SLOT_SYMBOL: 'STABLECOIN-SLOT',
}))

// Per-consumer captures: the fix is that no two of these can disagree.
const captured = vi.hoisted(() => ({
  usdPriceRaiseCurrency: undefined as string | undefined,
  detailsRaiseCurrency: undefined as string | undefined,
  detailsRaiseSymbol: undefined as string | undefined,
  submitRaiseCurrency: undefined as string | undefined,
  submitCurrencyAddress: undefined as string | undefined,
}))

vi.mock('uniswap/src/features/tokens/useCurrencyInfo', () => ({
  useNativeCurrencyInfo: () => ({ currency: { symbol: NATIVE_SLOT_SYMBOL } }),
  useCurrencyInfo: () => ({ currency: { symbol: STABLECOIN_SLOT_SYMBOL } }),
}))

vi.mock('~/pages/Liquidity/CreateAuction/hooks/useStableRaiseUsdPrice', () => ({
  useStableRaiseUsdPrice: ({ raiseCurrency }: { raiseCurrency: RaiseCurrency }) => {
    captured.usdPriceRaiseCurrency = raiseCurrency
    return null
  },
}))

vi.mock('~/pages/Liquidity/CreateAuction/hooks/useIsQuickLaunchMode', () => ({
  useIsQuickLaunchMode: () => false,
}))

vi.mock('~/pages/Liquidity/CreateAuction/components/reviewLaunch/ReviewLaunchTokenInfoSection', () => ({
  ReviewLaunchTokenInfoSection: () => null,
}))

vi.mock('~/pages/Liquidity/CreateAuction/components/reviewLaunch/ReviewLaunchAuctionDetailsSection', () => ({
  ReviewLaunchAuctionDetailsSection: ({
    configureAuction,
    raiseCurrencyInfo,
  }: {
    configureAuction: { raiseCurrency: RaiseCurrency }
    raiseCurrencyInfo: { currency: { symbol?: string } }
  }) => {
    captured.detailsRaiseCurrency = configureAuction.raiseCurrency
    captured.detailsRaiseSymbol = raiseCurrencyInfo.currency.symbol
    return <div data-testid="auction-details" />
  },
}))

vi.mock('~/pages/Liquidity/CreateAuction/components/LaunchAuctionReviewModal', () => ({
  LaunchAuctionReviewModal: () => null,
}))
vi.mock('~/pages/Liquidity/CreateAuction/components/LaunchAuctionErrorModal', () => ({
  LaunchAuctionErrorModal: () => null,
}))
vi.mock('~/pages/Liquidity/CreateAuction/components/LaunchAuctionSuccessModal', () => ({
  LaunchAuctionSuccessModal: () => null,
}))

vi.mock('~/pages/Liquidity/CreateAuction/hooks/useCreateAuctionSubmit', () => ({
  useCreateAuctionSubmit: ({
    configureAuction,
    currencyAddress,
  }: {
    configureAuction: { raiseCurrency: RaiseCurrency }
    currencyAddress: string
  }) => {
    captured.submitRaiseCurrency = configureAuction.raiseCurrency
    captured.submitCurrencyAddress = currencyAddress
    return { onLaunch: () => Promise.resolve(undefined), isPending: false, isDisabled: false }
  },
}))

vi.mock('~/pages/Liquidity/CreateAuction/hooks/useLaunchAuctionFlow', () => ({
  useLaunchAuctionFlow: () => ({
    isReviewModalVisible: false,
    isErrorModalOpen: false,
    isSuccessModalOpen: false,
    isLaunching: false,
    isPreparing: false,
    currentStepPending: false,
    currentProgressStepIndex: 0,
    progressSteps: [],
    launchError: undefined,
    launchTxHash: undefined,
    openReviewModal: () => undefined,
    closeReviewModal: () => undefined,
    handleLaunchToken: () => undefined,
    handleRetry: () => undefined,
    handleCloseErrorModal: () => undefined,
    handleCloseSuccessModal: () => undefined,
    handleViewAuction: () => undefined,
  }),
}))

/** Stores a STABLECOIN selection, then launches on `chainId`, as a chain switch after the commit does. */
function renderReviewStepWithStoredStablecoinSelection(chainId: UniverseChainId): void {
  const store = createCreateAuctionStore()
  const { actions } = store.getState()
  actions.setRaiseCurrency(RaiseCurrency.STABLECOIN)
  actions.commitTokenFormAndAdvance()
  actions.updateCreateNewTokenField('network', chainId)

  render(
    <CreateAuctionStoreContext.Provider value={store}>
      <ReviewLaunchStep />
    </CreateAuctionStoreContext.Provider>,
  )
}

describe('ReviewLaunchStep raise currency', () => {
  it('shows and submits the native asset on a chain whose raise options are the same token', () => {
    renderReviewStepWithStoredStablecoinSelection(UniverseChainId.Arc)

    expect(screen.getByTestId('auction-details')).toBeInTheDocument()
    expect(captured.detailsRaiseCurrency).toBe(RaiseCurrency.NATIVE)
    expect(captured.detailsRaiseSymbol).toBe(NATIVE_SLOT_SYMBOL)
    expect(captured.usdPriceRaiseCurrency).toBe(RaiseCurrency.NATIVE)
    expect(captured.submitRaiseCurrency).toBe(RaiseCurrency.NATIVE)
    expect(captured.submitCurrencyAddress).toBe(zeroAddress)
  })

  it('keeps the stored stablecoin selection on a chain whose raise options differ', () => {
    renderReviewStepWithStoredStablecoinSelection(UniverseChainId.Mainnet)

    expect(captured.detailsRaiseCurrency).toBe(RaiseCurrency.STABLECOIN)
    expect(captured.detailsRaiseSymbol).toBe(STABLECOIN_SLOT_SYMBOL)
    expect(captured.usdPriceRaiseCurrency).toBe(RaiseCurrency.STABLECOIN)
    expect(captured.submitRaiseCurrency).toBe(RaiseCurrency.STABLECOIN)
    expect(captured.submitCurrencyAddress).toBe(getPrimaryStablecoin(UniverseChainId.Mainnet).address)
  })
})
