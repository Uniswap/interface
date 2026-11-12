import { renderHook } from '@testing-library/react'
import { useOnReviewPress } from 'uniswap/src/features/transactions/swap/components/SwapFormButton/hooks/useOnReviewPress'

const { mockPrepareSwap, mockScreenActiveAddress, mockWarningService, mockWarningStoreActions } = vi.hoisted(() => ({
  mockPrepareSwap: vi.fn(),
  mockScreenActiveAddress: vi.fn(),
  mockWarningService: {
    setSkipBridgingWarning: vi.fn(),
    setSkipMaxTransferWarning: vi.fn(),
    setSkipTokenProtectionWarning: vi.fn(),
    setSkipBridgedAssetWarning: vi.fn(),
  },
  mockWarningStoreActions: {
    handleHideTokenWarningModal: vi.fn(),
    handleHideMaxNativeTransferModal: vi.fn(),
    handleHideBridgedAssetModal: vi.fn(),
  },
}))

vi.mock('uniswap/src/features/transactions/swap/components/SwapFormButton/hooks/useScreenActiveAddressOnPress', () => ({
  useScreenActiveAddressOnPress: () => mockScreenActiveAddress,
}))

vi.mock('uniswap/src/features/transactions/swap/services/hooks/usePrepareSwap', () => ({
  usePrepareSwap: () => mockPrepareSwap,
}))

vi.mock('uniswap/src/features/transactions/swap/services/hooks/useWarningService', () => ({
  useWarningService: () => mockWarningService,
}))

vi.mock('uniswap/src/features/transactions/swap/form/stores/swapFormWarningStore/useSwapFormWarningStore', () => ({
  useSwapFormWarningStoreActions: () => mockWarningStoreActions,
}))

/** Lets the screen through, as a clean address would. */
function screenClears(): void {
  mockScreenActiveAddress.mockImplementation((onClear: () => void) => onClear())
}

/** Withholds the continuation, as a blocked address would. */
function screenBlocks(): void {
  mockScreenActiveAddress.mockImplementation(() => undefined)
}

describe(useOnReviewPress, () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('reaches the review screen through the address screen, never directly', () => {
    screenClears()
    const { result } = renderHook(() => useOnReviewPress())

    result.current.handleOnReviewPress()

    expect(mockScreenActiveAddress).toHaveBeenCalledTimes(1)
    expect(mockPrepareSwap).toHaveBeenCalledTimes(1)
  })

  it('does not prepare the swap while the screen withholds it', () => {
    screenBlocks()
    const { result } = renderHook(() => useOnReviewPress())

    result.current.handleOnReviewPress()

    expect(mockScreenActiveAddress).toHaveBeenCalledTimes(1)
    expect(mockPrepareSwap).not.toHaveBeenCalled()
  })

  // Preparing the swap is now deferred behind the screen, so the flags have to be set on
  // the press itself rather than alongside prepareSwap.
  it('sets the skip flags on the press even when the screen withholds the swap', () => {
    screenBlocks()
    const { result } = renderHook(() => useOnReviewPress())

    result.current.handleOnAcknowledgeLowNativeBalancePress()

    expect(mockWarningService.setSkipBridgingWarning).toHaveBeenCalledWith(true)
    expect(mockWarningService.setSkipMaxTransferWarning).toHaveBeenCalledWith(true)
    expect(mockWarningService.setSkipTokenProtectionWarning).toHaveBeenCalledWith(true)
    expect(mockWarningService.setSkipBridgedAssetWarning).toHaveBeenCalledWith(false)
    expect(mockPrepareSwap).not.toHaveBeenCalled()
  })

  // Every acknowledge re-enters onReviewPress, so each is screened too. After the first
  // press these are cache hits, not extra vendor calls.
  it.each([
    ['token warning', (r: ReturnType<typeof useOnReviewPress>) => r.handleOnAcknowledgeTokenWarningPress],
    ['low native balance', (r: ReturnType<typeof useOnReviewPress>) => r.handleOnAcknowledgeLowNativeBalancePress],
    ['bridged asset', (r: ReturnType<typeof useOnReviewPress>) => r.handleOnAcknowledgeBridgedAssetPress],
  ])('screens the %s acknowledge press', (_label, pick) => {
    screenBlocks()
    const { result } = renderHook(() => useOnReviewPress())

    pick(result.current)()

    expect(mockScreenActiveAddress).toHaveBeenCalledTimes(1)
    expect(mockPrepareSwap).not.toHaveBeenCalled()
  })
})
