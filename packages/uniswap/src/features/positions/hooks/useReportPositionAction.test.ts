import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useReportPositionAction } from 'uniswap/src/features/positions/hooks/useReportPositionAction'
import type { PositionInfo } from 'uniswap/src/features/positions/types'
import { setPositionVisibility } from 'uniswap/src/features/visibility/slice'
import { renderHookWithProviders } from 'uniswap/src/test/render'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockSubmitPoolSpamReport, mockDispatch } = vi.hoisted(() => ({
  mockSubmitPoolSpamReport: vi.fn(),
  mockDispatch: vi.fn(),
}))

vi.mock('uniswap/src/features/reporting/reports', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/features/reporting/reports')>()),
  submitPoolSpamReport: mockSubmitPoolSpamReport,
}))

vi.mock('react-redux', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-redux')>()),
  useDispatch: () => mockDispatch,
}))

// ---------- Test fixtures ----------

const TOKEN0 = { address: '0xToken0', isNative: false } as unknown as PositionInfo['currency0Amount']['currency']
const TOKEN1 = { address: '0xToken1', isNative: false } as unknown as PositionInfo['currency1Amount']['currency']

const positionInfo = (overrides: Partial<PositionInfo> = {}): PositionInfo =>
  ({
    poolId: 'pool-1',
    tokenId: '42',
    chainId: UniverseChainId.Mainnet,
    version: ProtocolVersion.V3,
    currency0Amount: { currency: TOKEN0 },
    currency1Amount: { currency: TOKEN1 },
    ...overrides,
  }) as PositionInfo

describe('useReportPositionAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fires submitPoolSpamReport with values derived from the position', () => {
    const { result } = renderHookWithProviders(() => useReportPositionAction())

    const position = positionInfo()
    result.current({ position, isVisible: true })

    expect(mockSubmitPoolSpamReport).toHaveBeenCalledTimes(1)
    expect(mockSubmitPoolSpamReport).toHaveBeenCalledWith({
      chainId: position.chainId,
      poolId: position.poolId,
      version: position.version,
      token0: TOKEN0,
      token1: TOKEN1,
    })
  })

  it('dispatches setPositionVisibility(false) when the position is currently visible', () => {
    const { result } = renderHookWithProviders(() => useReportPositionAction())

    const position = positionInfo()
    result.current({ position, isVisible: true })

    expect(mockDispatch).toHaveBeenCalledTimes(1)
    expect(mockDispatch).toHaveBeenCalledWith(
      setPositionVisibility({
        poolId: position.poolId,
        tokenId: position.tokenId,
        chainId: position.chainId,
        isVisible: false,
      }),
    )
  })

  it('does not dispatch when the position is already hidden', () => {
    const { result } = renderHookWithProviders(() => useReportPositionAction())

    result.current({ position: positionInfo(), isVisible: false })

    expect(mockSubmitPoolSpamReport).toHaveBeenCalledTimes(1)
    expect(mockDispatch).not.toHaveBeenCalled()
  })

  it('invokes onSuccess with the input after the side effects fire', () => {
    const onSuccess = vi.fn()
    const { result } = renderHookWithProviders(() => useReportPositionAction({ onSuccess }))

    const input = { position: positionInfo(), isVisible: true }
    result.current(input)

    expect(onSuccess).toHaveBeenCalledTimes(1)
    expect(onSuccess).toHaveBeenCalledWith(input)

    // onSuccess fires after the analytics + dispatch
    expect(mockSubmitPoolSpamReport.mock.invocationCallOrder[0]).toBeLessThan(onSuccess.mock.invocationCallOrder[0]!)
    expect(mockDispatch.mock.invocationCallOrder[0]!).toBeLessThan(onSuccess.mock.invocationCallOrder[0]!)
  })

  it('does not throw when onSuccess is omitted', () => {
    const { result } = renderHookWithProviders(() => useReportPositionAction())

    expect(() => result.current({ position: positionInfo(), isVisible: true })).not.toThrow()
  })

  it('returns a stable callback identity across re-renders', () => {
    const { result, rerender } = renderHookWithProviders(() => useReportPositionAction())

    const first = result.current
    rerender()
    const second = result.current

    expect(first).toBe(second)
  })

  it('passes native currency objects through to submitPoolSpamReport unchanged', () => {
    const nativeToken = { isNative: true } as unknown as PositionInfo['currency0Amount']['currency']
    const { result } = renderHookWithProviders(() => useReportPositionAction())

    const position = positionInfo({
      currency0Amount: { currency: nativeToken } as PositionInfo['currency0Amount'],
    })
    result.current({ position, isVisible: false })

    expect(mockSubmitPoolSpamReport).toHaveBeenCalledWith(
      expect.objectContaining({ token0: nativeToken, token1: TOKEN1 }),
    )
  })
})
