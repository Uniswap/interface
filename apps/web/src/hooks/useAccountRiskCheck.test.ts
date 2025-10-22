import useAccountRiskCheck from 'hooks/useAccountRiskCheck'
import { setOpenModal } from 'state/application/reducer'
import { mocked } from 'test-utils/mocked'
import { renderHook } from 'test-utils/render'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useIsBlocked } from 'uniswap/src/features/trm/hooks'

// Mock the useAppDispatch hook
const dispatchMock = vi.fn()
vi.mock('state/hooks', async () => {
  const actual = await vi.importActual('state/hooks')
  return {
    ...actual,
    useAppDispatch: () => dispatchMock,
  }
})

vi.mock('uniswap/src/features/trm/hooks', () => ({
  useIsBlocked: vi.fn(),
}))

describe('useAccountRiskCheck', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should handle blocked EVM account', async () => {
    const evmAddress = 'blocked-evm-account'
    mocked(useIsBlocked).mockImplementation((address) => {
      if (address === evmAddress) {
        return { isBlocked: true, isBlockedLoading: false }
      }
      return { isBlocked: false, isBlockedLoading: false }
    })
    const { result } = renderHook(() => useAccountRiskCheck({ evmAddress }))
    expect(result.current).toBe(evmAddress)
    expect(dispatchMock).toHaveBeenCalledWith(
      setOpenModal({ name: ModalName.BlockedAccount, initialState: { blockedAddress: evmAddress } }),
    )
  })

  it('should handle blocked SVM account', async () => {
    const svmAddress = 'blocked-svm-account'
    mocked(useIsBlocked).mockImplementation((address) => {
      if (address === svmAddress) {
        return { isBlocked: true, isBlockedLoading: false }
      }
      return { isBlocked: false, isBlockedLoading: false }
    })
    const { result } = renderHook(() => useAccountRiskCheck({ svmAddress }))
    expect(result.current).toBe(svmAddress)
    expect(dispatchMock).toHaveBeenCalledWith(
      setOpenModal({ name: ModalName.BlockedAccount, initialState: { blockedAddress: svmAddress } }),
    )
  })

  it('should handle both EVM and SVM accounts blocked', async () => {
    const evmAddress = 'blocked-evm-account'
    const svmAddress = 'blocked-svm-account'
    mocked(useIsBlocked).mockReturnValue({ isBlocked: true, isBlockedLoading: false })
    renderHook(() => useAccountRiskCheck({ evmAddress, svmAddress }))

    // Both should be dispatched, but EVM is dispatched first
    expect(dispatchMock).toHaveBeenCalledTimes(2)
    expect(dispatchMock).toHaveBeenNthCalledWith(
      1,
      setOpenModal({ name: ModalName.BlockedAccount, initialState: { blockedAddress: evmAddress } }),
    )
    expect(dispatchMock).toHaveBeenNthCalledWith(
      2,
      setOpenModal({ name: ModalName.BlockedAccount, initialState: { blockedAddress: svmAddress } }),
    )
  })

  it('should handle non-blocked accounts', async () => {
    const evmAddress = 'non-blocked-evm-account'
    const svmAddress = 'non-blocked-svm-account'
    mocked(useIsBlocked).mockReturnValue({ isBlocked: false, isBlockedLoading: false })
    renderHook(() => useAccountRiskCheck({ evmAddress, svmAddress }))
    expect(dispatchMock).not.toHaveBeenCalled()
  })

  it('should not dispatch when addresses are loading', async () => {
    const evmAddress = 'evm-account'
    const svmAddress = 'svm-account'
    mocked(useIsBlocked).mockReturnValue({ isBlocked: false, isBlockedLoading: true })
    renderHook(() => useAccountRiskCheck({ evmAddress, svmAddress }))
    expect(dispatchMock).not.toHaveBeenCalled()
  })

  it('should handle one address blocked and the other not blocked', async () => {
    const evmAddress = 'blocked-evm-account'
    const svmAddress = 'non-blocked-svm-account'
    mocked(useIsBlocked).mockImplementation((address) => {
      if (address === evmAddress) {
        return { isBlocked: true, isBlockedLoading: false }
      }
      return { isBlocked: false, isBlockedLoading: false }
    })
    renderHook(() => useAccountRiskCheck({ evmAddress, svmAddress }))
    expect(dispatchMock).toHaveBeenCalledTimes(1)
    expect(dispatchMock).toHaveBeenCalledWith(
      setOpenModal({ name: ModalName.BlockedAccount, initialState: { blockedAddress: evmAddress } }),
    )
  })

  it('should handle no addresses provided', async () => {
    renderHook(() => useAccountRiskCheck({}))
    expect(dispatchMock).not.toHaveBeenCalled()
  })
})
