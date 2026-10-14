import { Token } from '@uniswap/sdk-core'
import { UniverseChainId } from '@universe/chains'
import { TestID } from '@universe/test'
import { createContext, type PropsWithChildren, useContext, useEffect } from 'react'
import { LaunchProvenanceMethod } from 'uniswap/src/features/dataApi/launchProvenance'
import { logger } from 'utilities/src/logger/logger'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useActiveAddress } from '~/features/accounts/store/hooks'
import { useBidTokenInfo } from '~/features/Toucan/Auction/hooks/useBidTokenInfo'
import { useWithdrawButtonState } from '~/features/Toucan/Auction/hooks/useWithdrawButtonState'
import { getLaunchProvenanceFromAuction } from '~/features/Toucan/Auction/utils/auctionLaunchMethod'
import { TokenDetailsClaimCard } from '~/pages/TokenDetails/components/claim/TokenDetailsClaimCard'
import { TokenDetailsClaimProvider } from '~/pages/TokenDetails/components/claim/TokenDetailsClaimProvider'
import type { TDPState } from '~/pages/TokenDetails/context/createTDPStore'
import { TokenDetailsSourceState } from '~/pages/TokenDetails/context/tokenDetailsSourceState'
import { useTDPStore } from '~/pages/TokenDetails/context/useTDPStore'
import { useTokenDetailsClaimableAllocation } from '~/pages/TokenDetails/hooks/useTokenDetailsClaimableAllocation'
import { type ClaimableAllocation, ClaimableAllocationState } from '~/pages/TokenDetails/utils/claimableAllocation'
import { getOwnStyleProp } from '~/test-utils/getOwnStyleProp'
import { mocked } from '~/test-utils/mocked'
import { act, fireEvent, render, screen } from '~/test-utils/render'

const mockStoreProvider = vi.fn()
const mockStoreUnmount = vi.fn()
const mockModalUnmount = vi.fn()
const MockSourceUpdates = createContext<object>({})

vi.mock('~/features/accounts/store/hooks', async (importOriginal) => ({
  ...(await importOriginal<typeof import('~/features/accounts/store/hooks')>()),
  useActiveAddress: vi.fn(),
}))
vi.mock('~/features/Toucan/Auction/utils/auctionLaunchMethod', () => ({ getLaunchProvenanceFromAuction: vi.fn() }))
vi.mock('~/pages/TokenDetails/context/useTDPStore', () => ({ useTDPStore: vi.fn() }))
vi.mock('~/pages/TokenDetails/hooks/useTokenDetailsClaimableAllocation', () => ({
  useTokenDetailsClaimableAllocation: vi.fn(),
}))
// The store provider mounts the ADP's loaders and block polling; the card only needs the context to exist.
vi.mock('~/features/Toucan/Auction/store/AuctionStoreContextProvider', () => ({
  AuctionStoreInstanceProvider: ({ children, ...props }: PropsWithChildren<Record<string, unknown>>) => {
    mockStoreProvider(props)
    useEffect(() => () => mockStoreUnmount(), [])
    return children
  },
}))
let mockUserBidsInitialized = true
vi.mock('~/features/Toucan/Auction/store/useAuctionStore', () => ({
  useAuctionStore: (selector: (state: unknown) => unknown) =>
    selector({
      progress: { outcome: 'GRADUATED' },
      auctionDetails: { claimBlock: '250' },
      currentBlockNumber: 300,
      userBidsInitialized: mockUserBidsInitialized,
    }),
}))
vi.mock('~/features/Toucan/Auction/hooks/useWithdrawButtonState', () => ({ useWithdrawButtonState: vi.fn() }))
vi.mock('~/features/Toucan/Auction/hooks/useBidTokenInfo', () => ({ useBidTokenInfo: vi.fn() }))
vi.mock('~/features/Toucan/Auction/Bids/WithdrawModal/WithdrawModal', () => ({
  WithdrawModal: ({ isOpen }: { isOpen: boolean }) => {
    useEffect(() => () => mockModalUnmount(), [])
    return isOpen ? <div data-testid="withdraw-modal" /> : null
  },
}))

const FOLD = new Token(UniverseChainId.Mainnet, '0xE172e9B6cfBeeB5593bDcE3f077356FDb33af904', 18, 'FOLD', 'Interfold')
const AUCTION = {
  address: '0x687Cc38d8279dF3352b64cF3EC1fe8e033933595',
  chainId: UniverseChainId.Mainnet,
  currency: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
}
const AUCTION_B = { ...AUCTION, address: '0x1234567890AbcdEF1234567890aBcdef12345678' }
const retry = vi.fn()
const refetchBidToken = vi.fn()

// The real query, address and store hooks subscribe independently of the memoized owner's parent;
// the mocks read this context so a rerender with a fresh value reaches them the same way.
function mockAllocation(allocation: ClaimableAllocation, shouldReserveClaimSpace = false): void {
  mocked(useTokenDetailsClaimableAllocation).mockImplementation(() => {
    useContext(MockSourceUpdates)
    return { allocation, shouldReserveClaimSpace, retry }
  })
}

function mockWallet(address: string | undefined): void {
  mocked(useActiveAddress).mockImplementation(() => {
    useContext(MockSourceUpdates)
    return address
  })
}

function ClaimCardTestTree({ isDesktop = true }: { isDesktop?: boolean }): JSX.Element {
  return (
    <MockSourceUpdates.Provider value={{}}>
      <TokenDetailsClaimProvider>
        <div aria-label="Claim cards">{isDesktop && <TokenDetailsClaimCard />}</div>
        <section>{!isDesktop && <TokenDetailsClaimCard />}</section>
        <div>Canonical token content</div>
      </TokenDetailsClaimProvider>
    </MockSourceUpdates.Provider>
  )
}

function mockTDPStore(auction: typeof AUCTION, auctions: (typeof AUCTION)[] = [auction]): void {
  const state = {
    currency: FOLD,
    currencyChainId: UniverseChainId.Mainnet,
    address: FOLD.address,
    auctionSource: { status: TokenDetailsSourceState.Found, auction, auctions },
  } as TDPState
  mocked(useTDPStore).mockImplementation(((selector: (s: TDPState) => unknown) => {
    useContext(MockSourceUpdates)
    return selector(state)
  }) as typeof useTDPStore)
}

function mockWithdrawButton({ isDisabled }: { isDisabled: boolean }): void {
  mocked(useWithdrawButtonState).mockReturnValue({
    label: 'Withdraw tokens',
    isDisabled,
    disabledTooltip: undefined,
    allBidsExited: false,
  })
}

describe('TokenDetailsClaimCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUserBidsInitialized = true
    mockWallet('0x1111111111111111111111111111111111111111')
    mocked(getLaunchProvenanceFromAuction).mockReturnValue({
      launchpad: { id: 'uniswap-cca', name: 'Uniswap' },
      method: LaunchProvenanceMethod.CustomAuction,
    })
    mockTDPStore(AUCTION)
    mockWithdrawButton({ isDisabled: false })
    mocked(useBidTokenInfo).mockReturnValue({
      refetch: refetchBidToken,
      bidTokenInfo: { symbol: 'USDC', decimals: 6, priceFiat: 1, isStablecoin: true, logoUrl: undefined },
      loading: false,
    })
  })

  it('shows the formatted allocation and a Claim CTA inside a store for the auction', () => {
    mockAllocation({ status: ClaimableAllocationState.Claimable, amountRaw: 1500n * 10n ** 18n })

    render(<ClaimCardTestTree />)

    expect(screen.getByText(/1,500/)).toBeInTheDocument()
    expect(screen.getByText('Received from auction')).toBeInTheDocument()
    expect(screen.getByTestId(TestID.TokenDetailsClaimButton)).toBeInTheDocument()
    expect(mockStoreProvider).toHaveBeenCalledWith(
      expect.objectContaining({ auctionAddress: AUCTION.address, chainId: UniverseChainId.Mainnet }),
    )
    expect(useWithdrawButtonState).toHaveBeenCalledWith({
      outcome: 'GRADUATED',
      claimBlock: '250',
      currentBlockNumber: 300,
      chainId: UniverseChainId.Mainnet,
    })
    expect(useBidTokenInfo).toHaveBeenCalledWith(expect.objectContaining({ skip: true }))
  })

  it('reserves the ended auction claim card while its allocation loads, without an amount or action', () => {
    mockAllocation({ status: ClaimableAllocationState.Loading }, true)

    const { rerender } = render(<ClaimCardTestTree />)

    expect(screen.getByTestId(TestID.TokenDetailsClaimSkeleton)).toBeInTheDocument()
    expect(screen.queryByTestId(TestID.TokenDetailsClaimCard)).not.toBeInTheDocument()
    expect(screen.queryByText('Received from auction')).not.toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()

    mockAllocation({ status: ClaimableAllocationState.Claimable, amountRaw: 1500n * 10n ** 18n })
    rerender(<ClaimCardTestTree />)

    expect(screen.getByTestId(TestID.TokenDetailsClaimCard)).toBeInTheDocument()
    expect(screen.queryByTestId(TestID.TokenDetailsClaimSkeleton)).not.toBeInTheDocument()
    expect(screen.getByText(/1,500/)).toBeInTheDocument()
    expect(screen.getByTestId(TestID.TokenDetailsClaimButton)).toBeInTheDocument()
  })

  it('removes the loading card when the wallet has no allocation', () => {
    mockAllocation({ status: ClaimableAllocationState.Loading }, true)
    const { rerender } = render(<ClaimCardTestTree />)
    expect(screen.getByTestId(TestID.TokenDetailsClaimSkeleton)).toBeInTheDocument()

    mockAllocation({ status: ClaimableAllocationState.NotEligible })
    rerender(<ClaimCardTestTree />)

    expect(screen.queryByTestId(TestID.TokenDetailsClaimCard)).not.toBeInTheDocument()
    expect(screen.queryByTestId(TestID.TokenDetailsClaimSkeleton)).not.toBeInTheDocument()
    expect(screen.getByLabelText('Claim cards')).toBeEmptyDOMElement()
  })

  it.each([
    ClaimableAllocationState.Claimed,
    ClaimableAllocationState.NotEligible,
    ClaimableAllocationState.NotOpen,
    ClaimableAllocationState.Loading,
  ] as const)('leaves no layout wrapper for a %s allocation', (status) => {
    mockAllocation({ status })

    render(<ClaimCardTestTree />)

    expect(screen.getByLabelText('Claim cards')).toBeEmptyDOMElement()
  })

  it('opens the withdraw modal from the Claim CTA', () => {
    mockAllocation({ status: ClaimableAllocationState.Claimable, amountRaw: 1500n * 10n ** 18n })

    render(<ClaimCardTestTree />)

    expect(screen.queryByTestId('withdraw-modal')).not.toBeInTheDocument()
    fireEvent.click(screen.getByTestId(TestID.TokenDetailsClaimButton))
    expect(screen.getByTestId('withdraw-modal')).toBeInTheDocument()
  })

  it('disables the Claim CTA until the store has loaded the wallet bids', () => {
    mockUserBidsInitialized = false
    mockAllocation({ status: ClaimableAllocationState.Claimable, amountRaw: 1500n * 10n ** 18n })

    render(<ClaimCardTestTree />)

    expect(screen.getByTestId(TestID.TokenDetailsClaimButton)).toBeDisabled()
  })

  it('keeps the modal closed while the ADP would disable withdrawing', () => {
    mockWithdrawButton({ isDisabled: true })
    mockAllocation({ status: ClaimableAllocationState.Claimable, amountRaw: 1500n * 10n ** 18n })

    render(<ClaimCardTestTree />)

    fireEvent.click(screen.getByTestId(TestID.TokenDetailsClaimButton))
    expect(screen.queryByTestId('withdraw-modal')).not.toBeInTheDocument()
  })

  it('offers Retry and View auction without an amount or a store when unavailable', () => {
    mockAllocation({ status: ClaimableAllocationState.Unavailable, error: new Error('boom') })

    render(<ClaimCardTestTree />)

    expect(screen.queryByText('Received from auction')).not.toBeInTheDocument()
    expect(screen.getByTestId(TestID.TokenDetailsClaimViewAuctionButton)).toBeInTheDocument()
    fireEvent.click(screen.getByTestId(TestID.TokenDetailsClaimRetryButton))
    expect(retry).toHaveBeenCalledTimes(1)
    expect(mockStoreProvider).not.toHaveBeenCalled()
  })

  it('shows the refund in the bid currency and opens the withdraw modal from the Refund CTA', () => {
    mockAllocation({ status: ClaimableAllocationState.Refundable, amountRaw: 3000n * 10n ** 6n })
    render(<ClaimCardTestTree />)

    expect(screen.getByText(/3,000.* USDC/)).toBeInTheDocument()
    expect(screen.getByText('Auction refund available')).toBeInTheDocument()
    expect(screen.queryByTestId(TestID.TokenDetailsClaimButton)).not.toBeInTheDocument()
    expect(useBidTokenInfo).toHaveBeenCalledWith({
      bidTokenAddress: AUCTION.currency,
      chainId: UniverseChainId.Mainnet,
      skip: false,
    })
    fireEvent.click(screen.getByTestId(TestID.TokenDetailsRefundButton))
    expect(screen.getByTestId('withdraw-modal')).toBeInTheDocument()
  })

  it('shows the refund subtitle and withholds the refund action while bid currency metadata loads', () => {
    mocked(useBidTokenInfo).mockReturnValue({ bidTokenInfo: undefined, loading: true, refetch: refetchBidToken })
    mockAllocation({ status: ClaimableAllocationState.Refundable, amountRaw: 3000n * 10n ** 6n })
    render(<ClaimCardTestTree />)
    expect(screen.getByText('Auction refund available')).toBeInTheDocument()
    expect(screen.queryByText(/USDC/)).not.toBeInTheDocument()
    fireEvent.click(screen.getByTestId(TestID.TokenDetailsRefundButton))
    expect(screen.queryByTestId('withdraw-modal')).not.toBeInTheDocument()
  })

  it('offers Retry and View auction instead of the refund action when the bid currency lookup fails', () => {
    mocked(useBidTokenInfo).mockReturnValue({
      refetch: refetchBidToken,
      bidTokenInfo: undefined,
      loading: false,
      error: new Error('lookup failed'),
    })
    mockAllocation({ status: ClaimableAllocationState.Refundable, amountRaw: 3000n * 10n ** 6n })
    render(<ClaimCardTestTree />)
    expect(screen.queryByTestId(TestID.TokenDetailsRefundButton)).not.toBeInTheDocument()
    expect(screen.queryByText('Auction refund available')).not.toBeInTheDocument()
    expect(screen.getByTestId(TestID.TokenDetailsClaimViewAuctionButton)).toBeInTheDocument()
    fireEvent.click(screen.getByTestId(TestID.TokenDetailsClaimRetryButton))
    expect(retry).toHaveBeenCalledTimes(1)
    expect(refetchBidToken).toHaveBeenCalledTimes(1)
  })

  it('keeps the refund card when the request fails but the bid currency still resolves locally', () => {
    mocked(useBidTokenInfo).mockReturnValue({
      refetch: refetchBidToken,
      bidTokenInfo: { symbol: 'USDC', decimals: 6, priceFiat: 1, isStablecoin: true, logoUrl: undefined },
      loading: false,
      error: new Error('lookup failed'),
    })
    mockAllocation({ status: ClaimableAllocationState.Refundable, amountRaw: 3000n * 10n ** 6n })
    render(<ClaimCardTestTree />)
    expect(screen.getByText(/3,000.* USDC/)).toBeInTheDocument()
    expect(screen.getByTestId(TestID.TokenDetailsRefundButton)).toBeEnabled()
    expect(screen.queryByTestId(TestID.TokenDetailsClaimRetryButton)).not.toBeInTheDocument()
  })

  it('offers Retry and View auction instead of a refund that has no bid currency to look up', () => {
    mockTDPStore({ ...AUCTION, currency: '' })
    mocked(useBidTokenInfo).mockReturnValue({ bidTokenInfo: undefined, loading: true, refetch: refetchBidToken })
    mockAllocation({ status: ClaimableAllocationState.Refundable, amountRaw: 3000n * 10n ** 6n })
    render(<ClaimCardTestTree />)
    expect(screen.queryByTestId(TestID.TokenDetailsRefundButton)).not.toBeInTheDocument()
    expect(screen.getByTestId(TestID.TokenDetailsClaimViewAuctionButton)).toBeInTheDocument()
    fireEvent.click(screen.getByTestId(TestID.TokenDetailsClaimRetryButton))
    expect(retry).toHaveBeenCalledTimes(1)
  })

  it('keeps the refund modal and the transaction owner through resizing, refresh failure and API convergence', () => {
    mockAllocation({ status: ClaimableAllocationState.Refundable, amountRaw: 3000n * 10n ** 6n })
    const { rerender } = render(<ClaimCardTestTree />)
    fireEvent.click(screen.getByTestId(TestID.TokenDetailsRefundButton))
    rerender(<ClaimCardTestTree isDesktop={false} />)
    expect(screen.getByTestId('withdraw-modal')).toBeInTheDocument()

    mockAllocation({ status: ClaimableAllocationState.Unavailable, error: new Error('Refresh failed') })
    rerender(<ClaimCardTestTree isDesktop={false} />)
    expect(screen.queryByTestId(TestID.TokenDetailsRefundButton)).not.toBeInTheDocument()
    expect(screen.queryByText(/3,000/)).not.toBeInTheDocument()
    expect(screen.queryByTestId('withdraw-modal')).not.toBeInTheDocument()

    mockAllocation({ status: ClaimableAllocationState.Refundable, amountRaw: 3000n * 10n ** 6n })
    rerender(<ClaimCardTestTree isDesktop={false} />)
    expect(screen.getByTestId(TestID.TokenDetailsRefundButton)).toBeInTheDocument()
    expect(screen.queryByTestId('withdraw-modal')).not.toBeInTheDocument()
    mockAllocation({ status: ClaimableAllocationState.NotEligible })
    rerender(<ClaimCardTestTree isDesktop={false} />)
    expect(screen.queryByTestId(TestID.TokenDetailsClaimCard)).not.toBeInTheDocument()
    expect(mockStoreUnmount).not.toHaveBeenCalled()
    expect(mockModalUnmount).not.toHaveBeenCalled()
    expect(mockStoreProvider).toHaveBeenLastCalledWith(
      expect.objectContaining({ onWithdrawalConfirmed: expect.any(Function) }),
    )
  })

  it('settles the card on the withdrawal receipt, ahead of the allocation', () => {
    mockAllocation({ status: ClaimableAllocationState.Claimable, amountRaw: 1500n * 10n ** 18n })
    const { rerender } = render(<ClaimCardTestTree />)
    expect(screen.getByTestId(TestID.TokenDetailsClaimButton)).toBeInTheDocument()

    const { onWithdrawalConfirmed } = mockStoreProvider.mock.lastCall?.[0] as { onWithdrawalConfirmed: () => void }
    act(() => onWithdrawalConfirmed())
    rerender(<ClaimCardTestTree />)

    expect(retry).toHaveBeenCalled()
    expect(screen.queryByTestId(TestID.TokenDetailsClaimCard)).not.toBeInTheDocument()
  })

  it('keeps refund action disabled while the shared ADP button is disabled', () => {
    mockWithdrawButton({ isDisabled: true })
    mockAllocation({ status: ClaimableAllocationState.Refundable, amountRaw: 3000n * 10n ** 6n })
    render(<ClaimCardTestTree />)
    fireEvent.click(screen.getByTestId(TestID.TokenDetailsRefundButton))
    expect(screen.queryByTestId('withdraw-modal')).not.toBeInTheDocument()
  })

  it('preserves the claim session through refresh failure and API convergence', () => {
    mockAllocation({ status: ClaimableAllocationState.Claimable, amountRaw: 1500n * 10n ** 18n })
    const { rerender } = render(<ClaimCardTestTree />)
    fireEvent.click(screen.getByTestId(TestID.TokenDetailsClaimButton))

    mockAllocation({ status: ClaimableAllocationState.Unavailable, error: new Error('Refresh failed') })
    rerender(<ClaimCardTestTree />)
    expect(screen.queryByTestId(TestID.TokenDetailsClaimButton)).not.toBeInTheDocument()
    expect(screen.queryByText(/1,500/)).not.toBeInTheDocument()
    expect(screen.queryByTestId('withdraw-modal')).not.toBeInTheDocument()
    fireEvent.click(screen.getByTestId(TestID.TokenDetailsClaimRetryButton))
    expect(retry).toHaveBeenCalledTimes(1)

    mockAllocation({ status: ClaimableAllocationState.Loading })
    rerender(<ClaimCardTestTree />)
    mockAllocation({ status: ClaimableAllocationState.Claimable, amountRaw: 1500n * 10n ** 18n })
    rerender(<ClaimCardTestTree />)
    expect(screen.getByTestId(TestID.TokenDetailsClaimButton)).toBeInTheDocument()
    expect(screen.queryByTestId('withdraw-modal')).not.toBeInTheDocument()

    fireEvent.click(screen.getByTestId(TestID.TokenDetailsClaimButton))
    mockAllocation({ status: ClaimableAllocationState.Claimed })
    rerender(<ClaimCardTestTree />)
    expect(screen.queryByTestId(TestID.TokenDetailsClaimCard)).not.toBeInTheDocument()
    expect(screen.getByLabelText('Claim cards')).toBeEmptyDOMElement()
    expect(mockStoreUnmount).not.toHaveBeenCalled()
    expect(mockModalUnmount).not.toHaveBeenCalled()
    expect(mockStoreProvider).toHaveBeenLastCalledWith(
      expect.objectContaining({ onWithdrawalConfirmed: expect.any(Function) }),
    )
  })

  it('does not reopen the modal once an allocation error recovers', () => {
    mockAllocation({ status: ClaimableAllocationState.Claimable, amountRaw: 1500n * 10n ** 18n })
    const { rerender } = render(<ClaimCardTestTree />)
    fireEvent.click(screen.getByTestId(TestID.TokenDetailsClaimButton))
    expect(screen.getByTestId('withdraw-modal')).toBeInTheDocument()

    mockAllocation({ status: ClaimableAllocationState.Unavailable, error: new Error('Refresh failed') })
    rerender(<ClaimCardTestTree />)
    mockAllocation({ status: ClaimableAllocationState.Claimable, amountRaw: 1500n * 10n ** 18n })
    rerender(<ClaimCardTestTree />)

    expect(screen.queryByTestId('withdraw-modal')).not.toBeInTheDocument()
    expect(mockModalUnmount).not.toHaveBeenCalled()
  })

  it('discards the old wallet session before showing another wallet or disconnecting', () => {
    mockAllocation({ status: ClaimableAllocationState.Claimable, amountRaw: 1500n * 10n ** 18n })
    const { rerender } = render(<ClaimCardTestTree />)
    fireEvent.click(screen.getByTestId(TestID.TokenDetailsClaimButton))

    mockWallet('0x2222222222222222222222222222222222222222')
    mockAllocation({ status: ClaimableAllocationState.Loading })
    rerender(<ClaimCardTestTree />)
    expect(mockStoreUnmount).toHaveBeenCalledTimes(1)
    expect(mockModalUnmount).toHaveBeenCalledTimes(1)
    expect(screen.queryByTestId('withdraw-modal')).not.toBeInTheDocument()

    mockAllocation({ status: ClaimableAllocationState.Claimable, amountRaw: 500n })
    rerender(<ClaimCardTestTree />)
    mockWallet(undefined)
    rerender(<ClaimCardTestTree />)
    expect(mockStoreUnmount).toHaveBeenCalledTimes(2)
    expect(screen.queryByTestId(TestID.TokenDetailsClaimCard)).not.toBeInTheDocument()
  })

  it('never mounts a retained claim session for unknown classification', () => {
    mockAllocation({ status: ClaimableAllocationState.Claimable, amountRaw: 500n })
    mocked(getLaunchProvenanceFromAuction).mockReturnValue({
      launchpad: { id: 'uniswap-cca', name: 'Uniswap' },
      method: LaunchProvenanceMethod.Unknown,
    })
    render(<ClaimCardTestTree />)
    expect(mockStoreProvider).not.toHaveBeenCalled()
    expect(screen.queryByTestId(TestID.TokenDetailsClaimCard)).not.toBeInTheDocument()
  })

  it('renders one claim card per custom auction, in auction order, stacked with an 8px gap', () => {
    mockTDPStore(AUCTION, [AUCTION, AUCTION_B])
    mocked(useTokenDetailsClaimableAllocation).mockImplementation(({ session }) => {
      useContext(MockSourceUpdates)
      const amountRaw = session.auction.address === AUCTION.address ? 1500n * 10n ** 18n : 250n * 10n ** 18n
      return {
        allocation: { status: ClaimableAllocationState.Claimable, amountRaw },
        shouldReserveClaimSpace: false,
        retry,
      }
    })

    render(<ClaimCardTestTree />)

    const cards = screen.getAllByTestId(TestID.TokenDetailsClaimCard)
    expect(cards).toHaveLength(2)
    expect(cards[0]).toHaveTextContent(/1,500/)
    expect(cards[1]).toHaveTextContent(/250/)
    const stack = cards[0]?.parentElement
    expect(stack).toBe(cards[1]?.parentElement)
    expect(stack && getOwnStyleProp(stack, 'gap')).toBe('$spacing8')
    expect(mockStoreProvider).toHaveBeenCalledWith(expect.objectContaining({ auctionAddress: AUCTION.address }))
    expect(mockStoreProvider).toHaveBeenCalledWith(expect.objectContaining({ auctionAddress: AUCTION_B.address }))
  })

  it('reserves one slot for several pending auctions and clears it when no allocation lands', () => {
    mockTDPStore(AUCTION, [AUCTION, AUCTION_B])
    mockAllocation({ status: ClaimableAllocationState.Loading }, true)

    const { rerender } = render(<ClaimCardTestTree />)

    expect(screen.getAllByTestId(TestID.TokenDetailsClaimSkeleton)).toHaveLength(1)
    expect(screen.queryByTestId(TestID.TokenDetailsClaimCard)).not.toBeInTheDocument()

    mockAllocation({ status: ClaimableAllocationState.NotEligible })
    rerender(<ClaimCardTestTree />)

    expect(screen.queryByTestId(TestID.TokenDetailsClaimSkeleton)).not.toBeInTheDocument()
    expect(screen.getByLabelText('Claim cards')).toBeEmptyDOMElement()
  })

  it('paints a resolved card above the single reserved slot', () => {
    mockTDPStore(AUCTION, [AUCTION, AUCTION_B])
    mocked(useTokenDetailsClaimableAllocation).mockImplementation(({ session }) => {
      useContext(MockSourceUpdates)
      return session.auction.address === AUCTION.address
        ? {
            allocation: { status: ClaimableAllocationState.Claimable, amountRaw: 1500n * 10n ** 18n },
            shouldReserveClaimSpace: false,
            retry,
          }
        : { allocation: { status: ClaimableAllocationState.Loading }, shouldReserveClaimSpace: true, retry }
    })

    render(<ClaimCardTestTree />)

    const card = screen.getByTestId(TestID.TokenDetailsClaimCard)
    const skeleton = screen.getByTestId(TestID.TokenDetailsClaimSkeleton)
    expect(card).toHaveTextContent(/1,500/)
    expect(card.parentElement).toBe(skeleton.parentElement)
    expect(card.compareDocumentPosition(skeleton) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('removes a card and its store when that auction leaves the page', () => {
    mockTDPStore(AUCTION, [AUCTION, AUCTION_B])
    mockAllocation({ status: ClaimableAllocationState.Claimable, amountRaw: 1500n * 10n ** 18n })
    const { rerender } = render(<ClaimCardTestTree />)
    expect(screen.getAllByTestId(TestID.TokenDetailsClaimCard)).toHaveLength(2)

    mockTDPStore(AUCTION, [AUCTION])
    rerender(<ClaimCardTestTree />)
    expect(screen.getAllByTestId(TestID.TokenDetailsClaimCard)).toHaveLength(1)
    expect(mockStoreUnmount).toHaveBeenCalledTimes(1)
    expect(mockStoreProvider).toHaveBeenLastCalledWith(expect.objectContaining({ auctionAddress: AUCTION.address }))
  })

  it('keeps the open modal and transaction owner when the card moves between responsive placements', () => {
    mockAllocation({ status: ClaimableAllocationState.Claimable, amountRaw: 1500n * 10n ** 18n })
    const { rerender } = render(<ClaimCardTestTree isDesktop />)
    fireEvent.click(screen.getByTestId(TestID.TokenDetailsClaimButton))

    rerender(<ClaimCardTestTree isDesktop={false} />)
    expect(screen.getAllByTestId(TestID.TokenDetailsClaimCard)).toHaveLength(1)
    expect(screen.getByTestId(TestID.TokenDetailsClaimCard).closest('section')).not.toBeNull()
    expect(screen.getByTestId('withdraw-modal')).toBeInTheDocument()

    rerender(<ClaimCardTestTree isDesktop />)
    expect(screen.getByTestId('withdraw-modal')).toBeInTheDocument()
    expect(mockStoreUnmount).not.toHaveBeenCalled()
    expect(mockModalUnmount).not.toHaveBeenCalled()
  })

  it('clears published amounts after the optional owner fails while preserving canonical content', () => {
    const loggerSpy = vi.spyOn(logger, 'error').mockImplementation(() => undefined)
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    mockAllocation({ status: ClaimableAllocationState.Claimable, amountRaw: 1500n * 10n ** 18n })
    const { rerender } = render(<ClaimCardTestTree />)
    expect(screen.getByTestId(TestID.TokenDetailsClaimCard)).toBeInTheDocument()

    mocked(useTokenDetailsClaimableAllocation).mockImplementation(() => {
      useContext(MockSourceUpdates)
      throw new Error('Allocation source failed')
    })
    rerender(<ClaimCardTestTree />)
    expect(screen.queryByTestId(TestID.TokenDetailsClaimCard)).not.toBeInTheDocument()
    expect(screen.getByText('Canonical token content')).toBeInTheDocument()
    expect(mockStoreUnmount).toHaveBeenCalledOnce()
    loggerSpy.mockRestore()
    consoleSpy.mockRestore()
  })

  it('preserves a healthy session and its open modal when another allocation source fails', () => {
    const loggerSpy = vi.spyOn(logger, 'error').mockImplementation(() => undefined)
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    mockTDPStore(AUCTION, [AUCTION, AUCTION_B])
    mockAllocation({ status: ClaimableAllocationState.Claimable, amountRaw: 1500n * 10n ** 18n })
    const { rerender } = render(<ClaimCardTestTree />)
    fireEvent.click(screen.getAllByTestId(TestID.TokenDetailsClaimButton)[1]!)
    expect(screen.getByTestId('withdraw-modal')).toBeInTheDocument()

    mocked(useTokenDetailsClaimableAllocation).mockImplementation(({ session }) => {
      useContext(MockSourceUpdates)
      if (session.auction.address === AUCTION.address) {
        throw new Error('Allocation source failed')
      }
      return {
        allocation: { status: ClaimableAllocationState.Claimable, amountRaw: 250n * 10n ** 18n },
        shouldReserveClaimSpace: false,
        retry,
      }
    })
    rerender(<ClaimCardTestTree />)

    expect(screen.getAllByTestId(TestID.TokenDetailsClaimCard)).toHaveLength(1)
    expect(screen.getByTestId(TestID.TokenDetailsClaimCard)).toHaveTextContent(/250/)
    expect(screen.getByTestId('withdraw-modal')).toBeInTheDocument()
    expect(mockStoreUnmount).toHaveBeenCalledOnce()
    expect(mockModalUnmount).toHaveBeenCalledOnce()
    expect(screen.getByText('Canonical token content')).toBeInTheDocument()
    loggerSpy.mockRestore()
    consoleSpy.mockRestore()
  })

  it.each([
    ClaimableAllocationState.Loading,
    ClaimableAllocationState.NotOpen,
    ClaimableAllocationState.NotEligible,
    ClaimableAllocationState.Claimed,
  ])('renders nothing for %s', (status) => {
    mockAllocation({ status } as ClaimableAllocation)

    render(<ClaimCardTestTree />)

    expect(screen.queryByTestId(TestID.TokenDetailsClaimCard)).not.toBeInTheDocument()
  })
})
