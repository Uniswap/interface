import useAccountRiskCheck from 'hooks/useAccountRiskCheck'
import { setOpenModal } from 'state/application/reducer'
import { mocked } from 'test-utils/mocked'
import { renderHook } from 'test-utils/render'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useIsBlocked } from 'uniswap/src/features/trm/hooks'

// Mock the useAppDispatch hook
const dispatchMock = jest.fn()
jest.mock('state/hooks', () => ({
  ...jest.requireActual('state/hooks'),
  useAppDispatch: () => dispatchMock,
}))

jest.mock('uniswap/src/features/trm/hooks', () => ({
  useIsBlocked: jest.fn(),
}))

describe('useAccountRiskCheck', () => {
  it('should handle blocked account', async () => {
    const account = 'blocked-account'
    mocked(useIsBlocked).mockReturnValue({ isBlocked: true, isBlockedLoading: false })
    renderHook(() => useAccountRiskCheck(account))
    expect(dispatchMock).toHaveBeenCalledWith(setOpenModal({ name: ModalName.BlockedAccount }))
  })

  it('should handle non-blocked account', async () => {
    const account = 'non-blocked-account'
    mocked(useIsBlocked).mockReturnValue({ isBlocked: false, isBlockedLoading: false })
    renderHook(() => useAccountRiskCheck(account))
    expect(dispatchMock).not.toHaveBeenCalledWith(setOpenModal({ name: ModalName.BlockedAccount }))
  })
})
