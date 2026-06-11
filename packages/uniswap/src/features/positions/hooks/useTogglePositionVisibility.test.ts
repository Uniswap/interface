import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { pushNotification } from 'uniswap/src/features/notifications/slice/slice'
import { AppNotificationType } from 'uniswap/src/features/notifications/slice/types'
import { useTogglePositionVisibility } from 'uniswap/src/features/positions/hooks/useTogglePositionVisibility'
import type { PositionInfo } from 'uniswap/src/features/positions/types'
import { setPositionVisibility } from 'uniswap/src/features/visibility/slice'
import { renderHookWithProviders } from 'uniswap/src/test/render'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockDispatch, mockUseActiveAddresses, mockUsePoolPositionCacheUpdater, mockUpdatePoolBalancesCache } =
  vi.hoisted(() => ({
    mockDispatch: vi.fn(),
    mockUseActiveAddresses: vi.fn(),
    mockUsePoolPositionCacheUpdater: vi.fn(),
    mockUpdatePoolBalancesCache: vi.fn(),
  }))

vi.mock('react-redux', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-redux')>()),
  useDispatch: () => mockDispatch,
}))

vi.mock('uniswap/src/features/accounts/store/hooks', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/features/accounts/store/hooks')>()),
  useActiveAddresses: mockUseActiveAddresses,
}))

vi.mock('uniswap/src/features/dataApi/balances/poolPositionCacheUpdater', () => ({
  usePoolPositionCacheUpdater: mockUsePoolPositionCacheUpdater,
}))

const positionInfo = (overrides: Partial<PositionInfo> = {}): PositionInfo =>
  ({
    poolId: 'pool-1',
    tokenId: '42',
    chainId: UniverseChainId.Mainnet,
    version: ProtocolVersion.V3,
    ...overrides,
  }) as PositionInfo

describe('useTogglePositionVisibility', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseActiveAddresses.mockReturnValue({ evmAddress: '0xuser', svmAddress: undefined })
    mockUsePoolPositionCacheUpdater.mockReturnValue(mockUpdatePoolBalancesCache)
  })

  it('hides a visible position: dispatches setPositionVisibility(false) and a "hidden" toast', () => {
    const { result } = renderHookWithProviders(() => useTogglePositionVisibility())
    const position = positionInfo()

    result.current({ position, isVisible: true })

    expect(mockUpdatePoolBalancesCache).toHaveBeenCalledWith(true, position)
    expect(mockDispatch).toHaveBeenCalledWith(
      setPositionVisibility({
        poolId: position.poolId,
        tokenId: position.tokenId,
        chainId: position.chainId,
        isVisible: false,
      }),
    )
    expect(mockDispatch).toHaveBeenCalledWith(
      pushNotification({
        type: AppNotificationType.AssetVisibility,
        visible: true,
        hideDelay: 2000,
        assetName: 'pool.position',
      }),
    )
  })

  it('unhides a hidden position: dispatches setPositionVisibility(true) and an "unhidden" toast', () => {
    const { result } = renderHookWithProviders(() => useTogglePositionVisibility())
    const position = positionInfo()

    result.current({ position, isVisible: false })

    expect(mockUpdatePoolBalancesCache).toHaveBeenCalledWith(false, position)
    expect(mockDispatch).toHaveBeenCalledWith(
      setPositionVisibility({
        poolId: position.poolId,
        tokenId: position.tokenId,
        chainId: position.chainId,
        isVisible: true,
      }),
    )
    expect(mockDispatch).toHaveBeenCalledWith(
      pushNotification({
        type: AppNotificationType.AssetVisibility,
        visible: false,
        hideDelay: 2000,
        assetName: 'pool.position',
      }),
    )
  })

  it('returns a stable callback identity across re-renders', () => {
    const { result, rerender } = renderHookWithProviders(() => useTogglePositionVisibility())

    const first = result.current
    rerender()

    expect(first).toBe(result.current)
  })
})
