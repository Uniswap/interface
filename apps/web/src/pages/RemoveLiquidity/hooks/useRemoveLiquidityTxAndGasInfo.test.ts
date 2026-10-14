import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook as renderHookBase, waitFor } from '@testing-library/react'
import {
  DecreasePositionRequest,
  DecreasePositionResponse,
} from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/api_pb'
import { createElement, type PropsWithChildren } from 'react'
import type { PositionInfo } from 'uniswap/src/features/positions/types'
import { useTransactionSettingsStore } from 'uniswap/src/features/transactions/components/settings/stores/transactionSettingsStore/useTransactionSettingsStore'
import { useRemoveLiquidityTxAndGasInfo } from '~/pages/RemoveLiquidity/hooks/useRemoveLiquidityTxAndGasInfo'
import {
  type CommittedDecrease,
  useRemoveLiquidityModalContext,
} from '~/pages/RemoveLiquidity/RemoveLiquidityModalContext'
import {
  buildDecreaseTxContext,
  buildPositionInfo,
  LIQUIDITY_SERVICE_POSITION_OWNER,
} from '~/test-utils/pools/liquidityServicePositionFixtures'

const { mockDecreasePosition, queryFnSpy } = vi.hoisted(() => ({ mockDecreasePosition: vi.fn(), queryFnSpy: vi.fn() }))

vi.mock('uniswap/src/features/accounts/store/hooks', () => ({
  useConnectionStatus: vi.fn(() => ({ isConnecting: false })),
  useActiveAddress: vi.fn(() => LIQUIDITY_SERVICE_POSITION_OWNER),
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
function renderHook<T>(hook: () => T): ReturnType<typeof renderHookBase<T, undefined>> {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  const wrapper = ({ children }: PropsWithChildren): JSX.Element =>
    createElement(QueryClientProvider, { client: queryClient }, children)
  return renderHookBase(hook, { wrapper })
}

function lastRequest(): DecreasePositionRequest | undefined {
  const lastCall = mockDecreasePosition.mock.calls.at(-1)?.[0] as { params?: DecreasePositionRequest } | undefined
  return lastCall?.params
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
})
