import { ApplicationModal, setOpenModal } from 'state/application/reducer'
import { renderHook, waitFor } from 'test-utils/render'

import useAccountRiskCheck from './useAccountRiskCheck'

// Mock the useAppDispatch hook
const dispatchMock = jest.fn()
jest.mock('state/hooks', () => ({
  useAppDispatch: () => dispatchMock,
}))

describe('useAccountRiskCheck', () => {
  it('should handle blocked account', async () => {
    const account = 'blocked-account'
    const mockResponse = { block: true }
    const fetchMock = jest.spyOn(window, 'fetch').mockResolvedValueOnce({
      json: jest.fn().mockResolvedValueOnce(mockResponse),
    } as any)

    renderHook(() => useAccountRiskCheck(account))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('https://interface.gateway.uniswap.org/v1/screen', {
        method: 'POST',
        headers: new Headers({
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({ address: account }),
      })

      expect(dispatchMock).toHaveBeenCalledWith(setOpenModal(ApplicationModal.BLOCKED_ACCOUNT))
    })
  })

  it('should handle non-blocked account', async () => {
    const account = 'non-blocked-account'
    const mockResponse = { block: false }
    const fetchMock = jest.spyOn(window, 'fetch').mockResolvedValueOnce({
      json: jest.fn().mockResolvedValueOnce(mockResponse),
    } as any)

    renderHook(() => useAccountRiskCheck(account))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('https://interface.gateway.uniswap.org/v1/screen', {
        method: 'POST',
        headers: new Headers({
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({ address: account }),
      })

      expect(dispatchMock).not.toHaveBeenCalledWith(setOpenModal(ApplicationModal.BLOCKED_ACCOUNT))
    })
  })
})
