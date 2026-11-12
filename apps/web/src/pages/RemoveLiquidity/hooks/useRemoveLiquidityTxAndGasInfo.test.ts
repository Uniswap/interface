import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook as renderHookBase, waitFor } from '@testing-library/react'
import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import {
  DecreasePositionRequest,
  DecreasePositionResponse,
} from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/api_pb'
import { createElement, type PropsWithChildren } from 'react'
import { useTransactionGasFee } from 'uniswap/src/features/gas/hooks'
import type { PositionInfo } from 'uniswap/src/features/positions/types'
import { useTransactionSettingsStore } from 'uniswap/src/features/transactions/components/settings/stores/transactionSettingsStore/useTransactionSettingsStore'
import { ONE_DAY_MS } from 'utilities/src/time/time'
import { useRemoveLiquidityTxAndGasInfo } from '~/pages/RemoveLiquidity/hooks/useRemoveLiquidityTxAndGasInfo'
import {
  type CommittedDecrease,
  useRemoveLiquidityModalContext,
} from '~/pages/RemoveLiquidity/RemoveLiquidityModalContext'
import { REMOVE_LIQUIDITY_HOOK, REMOVE_LIQUIDITY_HOOK_REVERT_DATA } from '~/test-utils/pools/hookRevertFixtures'
import {
  buildDecreaseTxContext,
  buildPositionInfo,
  LIQUIDITY_SERVICE_POSITION_OWNER,
} from '~/test-utils/pools/liquidityServicePositionFixtures'

const { mockDecreasePosition, queryFnSpy, mockCall } = vi.hoisted(() => ({
  mockDecreasePosition: vi.fn(),
  queryFnSpy: vi.fn(),
  mockCall: vi.fn(),
}))

vi.mock('uniswap/src/features/accounts/store/hooks', () => ({
  useConnectionStatus: vi.fn(() => ({ isConnecting: false })),
  useActiveAddress: vi.fn(() => LIQUIDITY_SERVICE_POSITION_OWNER),
}))
// The eth_call that checks whether an unestimated decrease reverts in the hook.
vi.mock('~/constants/providers', () => ({
  getInterfaceProvider: vi.fn(() => ({ call: mockCall })),
}))
vi.mock('~/pages/RemoveLiquidity/RemoveLiquidityModalContext', async (importOriginal) => ({
  ...(await importOriginal<typeof import('~/pages/RemoveLiquidity/RemoveLiquidityModalContext')>()),
  useRemoveLiquidityModalContext: vi.fn(),
}))
vi.mock(
  'uniswap/src/features/transactions/components/settings/stores/transactionSettingsStore/useTransactionSettingsStore',
  async (importOriginal) => ({
    ...(await importOriginal<
      typeof import('uniswap/src/features/transactions/components/settings/stores/transactionSettingsStore/useTransactionSettingsStore')
    >()),
    useTransactionSettingsStore: vi.fn(),
  }),
)
// Gas pricing is out of scope here and would otherwise reach for the network.
vi.mock('uniswap/src/features/gas/hooks', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/features/gas/hooks')>()),
  useTransactionGasFee: vi.fn(() => ({ displayValue: undefined })),
  useUSDCurrencyAmountOfGasFee: vi.fn(() => undefined),
}))
// Mock the liquidity-service query boundary only; the request construction under test is real.
vi.mock('uniswap/src/data/apiClients/liquidityService/liquidityQueries', async (importOriginal) => {
  const actual = await importOriginal<typeof import('uniswap/src/data/apiClients/liquidityService/liquidityQueries')>()
  return { ...actual, liquidityQueries: { ...actual.liquidityQueries, decreasePosition: mockDecreasePosition } }
})

const mockUseRemoveLiquidityModalContext = vi.mocked(useRemoveLiquidityModalContext)
const mockUseTransactionGasFee = vi.mocked(useTransactionGasFee)
const mockUseTransactionSettingsStore = vi.mocked(useTransactionSettingsStore)

const LIQUIDITY = '49387053232'
const CUSTOM_DEADLINE_MINUTES = 30
const T0_MS = 1_790_000_000_000
const DECREASE_TX = { to: '0xbD216513d74C8cf14cf4747E6AaA6420FF64ee9e', chainId: 1, data: '0x', value: '0' }

function mockModalContext({
  positionInfo,
  percent,
  committedDecrease,
}: {
  positionInfo: PositionInfo
  percent: string
  committedDecrease?: CommittedDecrease
}): void {
  mockUseRemoveLiquidityModalContext.mockReturnValue({
    positionInfo,
    percent,
    // Rebuilt alongside the position, as the modal context does from each poll.
    currencies: { TOKEN0: positionInfo.currency0Amount.currency, TOKEN1: positionInfo.currency1Amount.currency },
    percentInvalid: false,
    step: 0,
    setStep: vi.fn(),
    setPercent: vi.fn(),
    unwrapNativeCurrency: true,
    setUnwrapNativeCurrency: vi.fn(),
    currentTransactionStep: undefined,
    setCurrentTransactionStep: vi.fn(),
    committedDecrease,
    commitDecrease: vi.fn(),
    resetCommittedDecrease: vi.fn(),
    backToInput: vi.fn(),
  })
}

// With the modal context, settings and gas hooks mocked above, the hook only needs a query client; the app-wide
// test providers would also start the wagmi connectors.
function renderHook<T>(
  hook: () => T,
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } }),
): ReturnType<typeof renderHookBase<T, undefined>> {
  const wrapper = ({ children }: PropsWithChildren): JSX.Element =>
    createElement(QueryClientProvider, { client: queryClient }, children)
  return renderHookBase(hook, { wrapper })
}

function lastRequest(): DecreasePositionRequest | undefined {
  const lastCall = mockDecreasePosition.mock.calls.at(-1)?.[0] as { params?: DecreasePositionRequest } | undefined
  return lastCall?.params
}

function lastRefetchInterval(): unknown {
  return (mockDecreasePosition.mock.calls.at(-1)?.[0] as { refetchInterval?: unknown } | undefined)?.refetchInterval
}

function lastEnabled(): unknown {
  return (mockDecreasePosition.mock.calls.at(-1)?.[0] as { enabled?: unknown } | undefined)?.enabled
}

describe('useRemoveLiquidityTxAndGasInfo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(Date, 'now').mockReturnValue(T0_MS)
    mockUseTransactionSettingsStore.mockImplementation(((selector: (s: unknown) => unknown) =>
      selector({ customDeadline: CUSTOM_DEADLINE_MINUTES, customSlippageTolerance: 0.5 })) as never)
    mockDecreasePosition.mockImplementation(({ params, ...rest }: { params?: unknown }) => ({
      queryKey: ['test', 'decreasePosition', params],
      queryFn: async (): Promise<DecreasePositionResponse> => {
        queryFnSpy()
        return new DecreasePositionResponse({ decrease: DECREASE_TX, gasFee: '1000000000000000' })
      },
      ...rest,
    }))
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('keeps the quoted calldata when a poll rebuilds the position with the same values', async () => {
    mockModalContext({ positionInfo: buildPositionInfo({ liquidity: LIQUIDITY }), percent: '50' })

    const { result, rerender } = renderHook(() =>
      useRemoveLiquidityTxAndGasInfo({ account: LIQUIDITY_SERVICE_POSITION_OWNER }),
    )
    await waitFor(() => expect(result.current.decreaseCalldata).toBeDefined())

    const firstRequest = lastRequest()
    expect(firstRequest?.deadline).toBe(T0_MS / 1000 + CUSTOM_DEADLINE_MINUTES * 60)
    expect(firstRequest?.nftTokenId).toBe('13281')

    // A minute later the next GetPosition poll lands: equal values, new object identities throughout.
    vi.spyOn(Date, 'now').mockReturnValue(T0_MS + 60_000)
    mockModalContext({ positionInfo: buildPositionInfo({ liquidity: LIQUIDITY }), percent: '50' })
    act(() => rerender())

    // Same request object, so the now-based deadline is not re-stamped and the query key is unchanged...
    expect(lastRequest()).toBe(firstRequest)
    // ...which is what keeps the calldata (and the Confirm button behind it) in place.
    expect(result.current.decreaseCalldata).toBeDefined()
    expect(result.current.decreaseCalldataLoading).toBe(false)
    expect(queryFnSpy).toHaveBeenCalledTimes(1)
  })

  it('stops quoting the moment the user confirms, before any transaction step', async () => {
    const positionInfo = buildPositionInfo({ liquidity: LIQUIDITY })
    mockModalContext({ positionInfo, percent: '50' })

    const { result, rerender } = renderHook(() =>
      useRemoveLiquidityTxAndGasInfo({ account: LIQUIDITY_SERVICE_POSITION_OWNER }),
    )
    await waitFor(() => expect(result.current.decreaseCalldata).toBeDefined())
    expect(lastEnabled()).toBe(true)

    mockModalContext({
      positionInfo,
      percent: '50',
      committedDecrease: { positionInfo, txContext: buildDecreaseTxContext(positionInfo) },
    })
    act(() => rerender())

    expect(lastEnabled()).toBe(false)
    expect(result.current.decreaseCalldata).toBeDefined()
  })

  it('re-quotes when an input that changes the transaction changes', async () => {
    const positionInfo = buildPositionInfo({ liquidity: LIQUIDITY })
    mockModalContext({ positionInfo, percent: '50' })

    const { result, rerender } = renderHook(() =>
      useRemoveLiquidityTxAndGasInfo({ account: LIQUIDITY_SERVICE_POSITION_OWNER }),
    )
    await waitFor(() => expect(result.current.decreaseCalldata).toBeDefined())
    const firstRequest = lastRequest()

    mockModalContext({ positionInfo, percent: '75' })
    act(() => rerender())

    expect(lastRequest()).not.toBe(firstRequest)
    expect(lastRequest()?.liquidityPercentageToDecrease).toBe(75)
    await waitFor(() => expect(queryFnSpy).toHaveBeenCalledTimes(2))
  })

  it('re-quotes when the modal is reopened, instead of reusing the calldata quoted before an earlier removal', async () => {
    // The app's client caches for a day; without a custom deadline the request, and so the key, is the same
    // on every open.
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: ONE_DAY_MS } } })
    mockUseTransactionSettingsStore.mockImplementation(((selector: (s: unknown) => unknown) =>
      selector({ customDeadline: undefined, customSlippageTolerance: 0.5 })) as never)
    mockModalContext({ positionInfo: buildPositionInfo({ liquidity: LIQUIDITY }), percent: '50' })
    const useHook = (): ReturnType<typeof useRemoveLiquidityTxAndGasInfo> =>
      useRemoveLiquidityTxAndGasInfo({ account: LIQUIDITY_SERVICE_POSITION_OWNER })

    const firstOpen = renderHook(useHook, queryClient)
    await waitFor(() => expect(firstOpen.result.current.decreaseCalldata).toBeDefined())
    firstOpen.unmount()
    await waitFor(() =>
      expect(queryClient.getQueryCache().findAll({ queryKey: ['test', 'decreasePosition'] })).toEqual([]),
    )

    const secondOpen = renderHook(useHook, queryClient)

    expect(secondOpen.result.current.decreaseCalldata).toBeUndefined()
    expect(secondOpen.result.current.decreaseCalldataLoading).toBe(true)
    await waitFor(() => expect(secondOpen.result.current.decreaseCalldata).toBeDefined())
    expect(queryFnSpy).toHaveBeenCalledTimes(2)
  })

  describe('when the pool has a remove-liquidity hook', () => {
    function buildHookedPositionInfo(): PositionInfo {
      const positionInfo = buildPositionInfo({ liquidity: LIQUIDITY })
      if (positionInfo.version !== ProtocolVersion.V4) {
        throw new Error('expected the v4 fixture')
      }
      return { ...positionInfo, v4hook: REMOVE_LIQUIDITY_HOOK }
    }

    function mockDecreaseWithoutGasFee(): void {
      mockDecreasePosition.mockImplementation(({ params, ...rest }: { params?: unknown }) => ({
        queryKey: ['test', 'decreasePosition', params],
        queryFn: async (): Promise<DecreasePositionResponse> => {
          queryFnSpy()
          // The service's own simulation failed, so it quotes the calldata without a gas fee.
          return new DecreasePositionResponse({ decrease: DECREASE_TX })
        },
        ...rest,
      }))
    }

    // The gas hook reports a failed estimate as no fee, not an error: the gas service's 400 for that position
    // (HookNotImplemented() from beforeRemoveLiquidity) falls back to a client-side estimate that swallows the revert.
    function mockGasEstimate(displayValue: string | undefined): void {
      mockUseTransactionGasFee.mockImplementation((({ tx, skip }: { tx?: unknown; skip?: boolean }) => ({
        displayValue: tx && !skip ? displayValue : undefined,
        error: null,
        isLoading: false,
      })) as never)
    }

    beforeEach(() => {
      mockCall.mockReset()
    })

    it('blocks, offers a retry, and stops polling when the eth_call reverts in the hook', async () => {
      mockDecreaseWithoutGasFee()
      mockGasEstimate(undefined)
      mockCall.mockResolvedValue(REMOVE_LIQUIDITY_HOOK_REVERT_DATA)
      mockModalContext({
        positionInfo: buildHookedPositionInfo(),
        percent: '25',
      })

      const { result } = renderHook(() => useRemoveLiquidityTxAndGasInfo({ account: LIQUIDITY_SERVICE_POSITION_OWNER }))

      await waitFor(() => expect(result.current.hookRejectsRemoval).toBe(true))
      expect(result.current.decreaseCalldata).toBeDefined()
      expect(result.current.error).toBe(true)
      expect(result.current.refetch).toBeDefined()
      expect(result.current.decreaseMayFail).toBe(false)
      // A poll would re-stamp the deadline and re-run the estimate, hiding the rejection while it reloads.
      expect(lastRefetchInterval()).toBe(false)
    })

    it('only warns, and keeps quoting, when the estimate is unavailable but nothing shows a revert', async () => {
      mockDecreaseWithoutGasFee()
      mockGasEstimate(undefined)
      // e.g. the RPC is down: the check cannot see a revert, so it must not block the withdrawal.
      mockCall.mockRejectedValue(new Error('401 Unauthorized'))
      mockModalContext({ positionInfo: buildHookedPositionInfo(), percent: '25' })

      const { result } = renderHook(() => useRemoveLiquidityTxAndGasInfo({ account: LIQUIDITY_SERVICE_POSITION_OWNER }))

      await waitFor(() => expect(result.current.decreaseMayFail).toBe(true))
      expect(mockCall).toHaveBeenCalledTimes(1)
      expect(result.current.hookRejectsRemoval).toBe(false)
      expect(result.current.error).toBe(false)
      expect(lastRefetchInterval()).not.toBe(false)
    })

    it('does not report a rejection when the service simulated the decrease', async () => {
      mockGasEstimate(undefined)
      mockModalContext({
        positionInfo: buildHookedPositionInfo(),
        percent: '25',
      })

      const { result } = renderHook(() => useRemoveLiquidityTxAndGasInfo({ account: LIQUIDITY_SERVICE_POSITION_OWNER }))

      await waitFor(() => expect(result.current.decreaseCalldata).toBeDefined())
      expect(result.current.hookRejectsRemoval).toBe(false)
      expect(result.current.decreaseMayFail).toBe(false)
      expect(result.current.error).toBe(false)
      expect(mockCall).not.toHaveBeenCalled()
      expect(lastRefetchInterval()).not.toBe(false)
    })

    it('does not report a rejection when only the service simulation failed', async () => {
      mockDecreaseWithoutGasFee()
      mockGasEstimate('21000000000000')
      mockModalContext({ positionInfo: buildHookedPositionInfo(), percent: '25' })

      const { result } = renderHook(() => useRemoveLiquidityTxAndGasInfo({ account: LIQUIDITY_SERVICE_POSITION_OWNER }))

      await waitFor(() => expect(result.current.decreaseCalldata).toBeDefined())
      expect(result.current.hookRejectsRemoval).toBe(false)
      expect(result.current.decreaseMayFail).toBe(false)
      expect(result.current.error).toBe(false)
      expect(mockCall).not.toHaveBeenCalled()
    })

    it('does not attribute a failed estimate to a pool without a remove-liquidity hook', async () => {
      mockDecreaseWithoutGasFee()
      mockGasEstimate(undefined)
      mockModalContext({ positionInfo: buildPositionInfo({ liquidity: LIQUIDITY }), percent: '25' })

      const { result } = renderHook(() => useRemoveLiquidityTxAndGasInfo({ account: LIQUIDITY_SERVICE_POSITION_OWNER }))

      await waitFor(() => expect(result.current.decreaseCalldata).toBeDefined())
      expect(result.current.hookRejectsRemoval).toBe(false)
      expect(result.current.decreaseMayFail).toBe(false)
      expect(result.current.error).toBe(false)
      expect(mockCall).not.toHaveBeenCalled()
    })
  })
})
