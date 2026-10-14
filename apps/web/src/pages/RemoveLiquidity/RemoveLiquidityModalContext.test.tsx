import { configureStore } from '@reduxjs/toolkit'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import type { Position as LiquidityServicePosition } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/types_pb'
import type { PropsWithChildren } from 'react'
import { Provider } from 'react-redux'
import type { PositionInfo } from 'uniswap/src/features/positions/types'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import {
  DecreaseLiquidityStep,
  REMOVE_LIQUIDITY_REFETCH_INTERVAL_MS,
  RemoveLiquidityModalContextProvider,
  useRemoveLiquidityModalContext,
} from '~/pages/RemoveLiquidity/RemoveLiquidityModalContext'
import applicationReducer, { setCloseModal, setOpenModal } from '~/state/application/reducer'
import {
  buildDecreaseTxContext,
  buildLiquidityServicePosition,
  buildPositionInfo,
  LIQUIDITY_SERVICE_POSITION_OWNER,
} from '~/test-utils/pools/liquidityServicePositionFixtures'

const { mockGetPosition, queryFnSpy } = vi.hoisted(() => ({ mockGetPosition: vi.fn(), queryFnSpy: vi.fn() }))

// Extends the global setupTests mock of the accounts store (which only provides `useConnectionStatus`) with the
// address the modal keys V2 reads on (position keyed by pair + wallet): the fixture owner.
vi.mock('uniswap/src/features/accounts/store/hooks', () => ({
  useConnectionStatus: vi.fn(() => ({ isConnecting: false })),
  useActiveAddress: vi.fn(() => LIQUIDITY_SERVICE_POSITION_OWNER),
}))

// Mock the liquidity-service query boundary only; the request mapping, parsing and context logic are real.
vi.mock('uniswap/src/data/apiClients/liquidityService/liquidityQueries', async (importOriginal) => {
  const actual = await importOriginal<typeof import('uniswap/src/data/apiClients/liquidityService/liquidityQueries')>()
  return { ...actual, liquidityQueries: { ...actual.liquidityQueries, getPosition: mockGetPosition } }
})

const SNAPSHOT_LIQUIDITY = '49387053232'
const LIVE_LIQUIDITY = '24693526616'
const DRAINED_LIQUIDITY = '1'

/**
 * Serves `responses` in order (the last one repeats), passing every other query option (enabled, refetchInterval)
 * through. A promise entry keeps that read in flight until the test resolves it.
 */
function serveLiveReads(responses: Array<LiquidityServicePosition | Promise<LiquidityServicePosition>>): void {
  let call = 0
  mockGetPosition.mockImplementation(({ params, ...rest }: { params?: unknown }) => ({
    queryKey: ['test', 'getPosition', params],
    queryFn: async (): Promise<{ position: LiquidityServicePosition }> => {
      queryFnSpy()
      const position = await responses[Math.min(call, responses.length - 1)]
      call++
      return { position }
    },
    ...rest,
  }))
}

function deferredRead(): {
  read: Promise<LiquidityServicePosition>
  land: (position: LiquidityServicePosition) => void
} {
  let land: (position: LiquidityServicePosition) => void = () => undefined
  const read = new Promise<LiquidityServicePosition>((resolve) => {
    land = resolve
  })
  return { read, land }
}

function lastQueryOptions(): { refetchInterval?: unknown; enabled?: unknown } {
  return (mockGetPosition.mock.calls.at(-1)?.[0] as { refetchInterval?: unknown; enabled?: unknown } | undefined) ?? {}
}

function lastRefetchInterval(): unknown {
  return lastQueryOptions().refetchInterval
}

function cachedLiquidity(queryClient: QueryClient): string | undefined {
  const [, data] = queryClient.getQueriesData<{ position: LiquidityServicePosition }>({
    queryKey: ['test', 'getPosition'],
  })[0] ?? [undefined, undefined]
  return data?.position.liquidity
}

type ContextValue = ReturnType<typeof useRemoveLiquidityModalContext>

function displayedPosition(result: { current: ContextValue }): PositionInfo {
  const position = result.current.positionInfo
  if (!position) {
    throw new Error('expected the context to expose a position')
  }
  return position
}

// The provider reads the modal's initial state from the application slice and polls the position through
// react-query, so mount only those two; the app-wide test providers (test-utils/render) also mount the wagmi
// connectors, which this test has no use for.
// The modal's initial state is a PositionInfo (sdk objects), so the dev-only serializability checks are off, as in
// the app store.
const store = configureStore({
  reducer: { application: applicationReducer },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware({ serializableCheck: false, immutableCheck: false }),
})

function renderContext(): { result: { current: ContextValue }; queryClient: QueryClient } {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  const wrapper = ({ children }: PropsWithChildren): JSX.Element => (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <RemoveLiquidityModalContextProvider>{children}</RemoveLiquidityModalContextProvider>
      </QueryClientProvider>
    </Provider>
  )
  const { result } = renderHook(useRemoveLiquidityModalContext, { wrapper })
  return { result, queryClient }
}

/** Stands in for the next 5 s poll without waiting on real timers (the cadence itself is asserted separately). */
async function nextPoll(queryClient: QueryClient): Promise<void> {
  await act(async () => {
    await queryClient.refetchQueries({ queryKey: ['test', 'getPosition'] })
  })
}

describe('RemoveLiquidityModalContextProvider', () => {
  const snapshot = buildPositionInfo({ liquidity: SNAPSHOT_LIQUIDITY })

  beforeEach(() => {
    vi.clearAllMocks()
    act(() => {
      store.dispatch(setOpenModal({ name: ModalName.RemoveLiquidity, initialState: snapshot }))
    })
  })

  afterEach(() => {
    // Unmount before closing the modal: the Redux store is shared across tests.
    cleanup()
    store.dispatch(setCloseModal())
  })

  it('shows the click-time snapshot until the live read lands, then the live position', async () => {
    serveLiveReads([buildLiquidityServicePosition({ liquidity: LIVE_LIQUIDITY })])

    const { result } = renderContext()

    // Never blank: the snapshot is the initial value.
    expect(result.current.positionInfo?.liquidity).toBe(SNAPSHOT_LIQUIDITY)
    expect(result.current.currencies?.TOKEN1.symbol).toBe('USDT')

    await waitFor(() => expect(result.current.positionInfo?.liquidity).toBe(LIVE_LIQUIDITY))
    // Half the liquidity → half the token amounts the form and review screens display (±1 wei of rounding).
    const live = result.current.positionInfo
    expect(live?.currency1Amount.multiply(2).subtract(snapshot.currency1Amount).quotient.toString()).toMatch(/^-?[01]$/)
    expect(live?.currency0Amount.multiply(2).subtract(snapshot.currency0Amount).quotient.toString()).toMatch(/^-?[01]$/)
  })

  it('reads the position by its key on the calldata cadence while the modal is open', async () => {
    serveLiveReads([buildLiquidityServicePosition({ liquidity: LIVE_LIQUIDITY })])

    const { result } = renderContext()
    await waitFor(() => expect(result.current.positionInfo?.liquidity).toBe(LIVE_LIQUIDITY))

    expect(mockGetPosition).toHaveBeenCalledWith(
      expect.objectContaining({
        params: expect.objectContaining({ tokenId: '13281' }),
        enabled: true,
        refetchInterval: REMOVE_LIQUIDITY_REFETCH_INTERVAL_MS,
      }),
    )
    // Independent literal: the decrease calldata has always been quoted every 5 s.
    expect(REMOVE_LIQUIDITY_REFETCH_INTERVAL_MS).toBe(5000)
  })

  it('replaces the displayed position on each poll, so a drained position shows as drained', async () => {
    serveLiveReads([
      buildLiquidityServicePosition({ liquidity: LIVE_LIQUIDITY }),
      buildLiquidityServicePosition({ liquidity: DRAINED_LIQUIDITY }),
    ])

    const { result, queryClient } = renderContext()
    await waitFor(() => expect(result.current.positionInfo?.liquidity).toBe(LIVE_LIQUIDITY))

    await nextPoll(queryClient)

    await waitFor(() => expect(result.current.positionInfo?.liquidity).toBe(DRAINED_LIQUIDITY))
    expect(result.current.positionInfo?.currency1Amount.quotient.toString()).toBe('0')
  })

  it('goes dormant the moment the user confirms, before any transaction step is reached', async () => {
    serveLiveReads([buildLiquidityServicePosition({ liquidity: LIVE_LIQUIDITY })])

    const { result } = renderContext()
    await waitFor(() => expect(result.current.positionInfo?.liquidity).toBe(LIVE_LIQUIDITY))
    expect(lastQueryOptions()).toMatchObject({ enabled: true, refetchInterval: REMOVE_LIQUIDITY_REFETCH_INTERVAL_MS })
    const livePosition = displayedPosition(result)
    const txContext = buildDecreaseTxContext(livePosition)

    // Confirm: the saga has the tx but has not yet reached a step (it may first be awaiting a chain switch).
    act(() => {
      result.current.commitDecrease(txContext)
    })

    expect(result.current.currentTransactionStep).toBeUndefined()
    expect(lastQueryOptions()).toMatchObject({ enabled: false, refetchInterval: false })
    // The snapshot is the very object the transaction was built from.
    expect(result.current.committedDecrease).toEqual({ positionInfo: livePosition, txContext })
    expect(result.current.positionInfo).toBe(livePosition)
  })

  it('keeps the committed snapshot when a read already in flight lands after confirm', async () => {
    const late = deferredRead()
    serveLiveReads([buildLiquidityServicePosition({ liquidity: LIVE_LIQUIDITY }), late.read])

    const { result, queryClient } = renderContext()
    await waitFor(() => expect(result.current.positionInfo?.liquidity).toBe(LIVE_LIQUIDITY))
    const livePosition = displayedPosition(result)

    // The poll fires, then the user confirms while it is still in flight.
    const inFlightPoll = queryClient.refetchQueries({ queryKey: ['test', 'getPosition'] })
    await waitFor(() => expect(queryFnSpy).toHaveBeenCalledTimes(2))
    act(() => {
      result.current.commitDecrease(buildDecreaseTxContext(livePosition))
    })

    await act(async () => {
      late.land(buildLiquidityServicePosition({ liquidity: DRAINED_LIQUIDITY }))
      await inFlightPoll
    })

    // The read did land in the cache, yet what is shown is still what the saga was handed.
    expect(cachedLiquidity(queryClient)).toBe(DRAINED_LIQUIDITY)
    expect(result.current.positionInfo).toBe(livePosition)
    expect(result.current.positionInfo?.liquidity).toBe(LIVE_LIQUIDITY)
  })

  it('shows the live position and polls again once the flow is reset', async () => {
    const late = deferredRead()
    serveLiveReads([buildLiquidityServicePosition({ liquidity: LIVE_LIQUIDITY }), late.read])

    const { result, queryClient } = renderContext()
    await waitFor(() => expect(result.current.positionInfo?.liquidity).toBe(LIVE_LIQUIDITY))

    const inFlightPoll = queryClient.refetchQueries({ queryKey: ['test', 'getPosition'] })
    await waitFor(() => expect(queryFnSpy).toHaveBeenCalledTimes(2))
    act(() => {
      result.current.commitDecrease(buildDecreaseTxContext(displayedPosition(result)))
    })
    await act(async () => {
      late.land(buildLiquidityServicePosition({ liquidity: DRAINED_LIQUIDITY }))
      await inFlightPoll
    })
    expect(result.current.positionInfo?.liquidity).toBe(LIVE_LIQUIDITY)

    // The wallet rejected (or the chain switch was dismissed): the user is back at the review with Confirm.
    act(() => {
      result.current.resetCommittedDecrease()
    })

    expect(result.current.committedDecrease).toBeUndefined()
    expect(result.current.positionInfo?.liquidity).toBe(DRAINED_LIQUIDITY)
    expect(lastQueryOptions()).toMatchObject({ enabled: true, refetchInterval: REMOVE_LIQUIDITY_REFETCH_INTERVAL_MS })
  })

  it('un-freezes the position and polls again when the user goes back to the form', async () => {
    const late = deferredRead()
    serveLiveReads([buildLiquidityServicePosition({ liquidity: LIVE_LIQUIDITY }), late.read])

    const { result, queryClient } = renderContext()
    await waitFor(() => expect(result.current.positionInfo?.liquidity).toBe(LIVE_LIQUIDITY))
    act(() => {
      result.current.setStep(DecreaseLiquidityStep.Review)
    })

    const inFlightPoll = queryClient.refetchQueries({ queryKey: ['test', 'getPosition'] })
    await waitFor(() => expect(queryFnSpy).toHaveBeenCalledTimes(2))
    act(() => {
      result.current.commitDecrease(buildDecreaseTxContext(displayedPosition(result)))
    })
    await act(async () => {
      late.land(buildLiquidityServicePosition({ liquidity: DRAINED_LIQUIDITY }))
      await inFlightPoll
    })
    expect(result.current.positionInfo?.liquidity).toBe(LIVE_LIQUIDITY)
    expect(lastQueryOptions()).toMatchObject({ enabled: false, refetchInterval: false })

    // Back while the saga is still running: the form edits the live position, not the committed snapshot.
    act(() => {
      result.current.backToInput()
    })

    expect(result.current.step).toBe(DecreaseLiquidityStep.Input)
    expect(result.current.committedDecrease).toBeUndefined()
    expect(result.current.positionInfo?.liquidity).toBe(DRAINED_LIQUIDITY)
    expect(lastQueryOptions()).toMatchObject({ enabled: true, refetchInterval: REMOVE_LIQUIDITY_REFETCH_INTERVAL_MS })
  })

  it('keeps the snapshot when the live read fails', async () => {
    mockGetPosition.mockImplementation(({ params, ...rest }: { params?: unknown }) => ({
      queryKey: ['test', 'getPosition', params],
      queryFn: async (): Promise<never> => {
        queryFnSpy()
        throw new Error('liquidity service unavailable')
      },
      ...rest,
      retry: false,
    }))

    const { result } = renderContext()
    await waitFor(() => expect(queryFnSpy).toHaveBeenCalled())

    expect(result.current.positionInfo?.liquidity).toBe(SNAPSHOT_LIQUIDITY)
  })
})
