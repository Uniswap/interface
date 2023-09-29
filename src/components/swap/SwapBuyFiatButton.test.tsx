import userEvent from '@testing-library/user-event'
import { useWeb3React } from '@web3-react/core'
import { useAccountDrawer } from 'components/AccountDrawer'
import store from 'state'
import { setOriginCountry } from 'state/user/reducer'
import { mocked } from 'test-utils/mocked'
import { act, fireEvent, render, screen } from 'test-utils/render'

import { useFiatOnrampAvailability, useOpenModal } from '../../state/application/hooks'
import SwapBuyFiatButton, { MOONPAY_REGION_AVAILABILITY_ARTICLE } from './SwapBuyFiatButton'

jest.mock('../../state/application/hooks')
const mockUseFiatOnrampAvailability = useFiatOnrampAvailability as jest.MockedFunction<typeof useFiatOnrampAvailability>
const mockUseOpenModal = useOpenModal as jest.MockedFunction<typeof useOpenModal>

jest.mock('components/AccountDrawer')
const mockuseAccountDrawer = useAccountDrawer as jest.MockedFunction<typeof useAccountDrawer>

const mockUseFiatOnRampsUnavailable = (shouldCheck: boolean) => {
  return {
    available: false,
    availabilityChecked: shouldCheck,
    error: null,
    loading: false,
  }
}

const mockUseFiatOnRampsAvailable = (shouldCheck: boolean) => {
  if (shouldCheck) {
    return {
      available: true,
      availabilityChecked: true,
      error: null,
      loading: false,
    }
  }
  return {
    available: false,
    availabilityChecked: false,
    error: null,
    loading: false,
  }
}

describe('SwapBuyFiatButton.tsx', () => {
  let toggleWalletDrawer: jest.Mock<any, any>
  let useOpenModal: jest.Mock<any, any>

  beforeAll(() => {
    store.dispatch(setOriginCountry('US'))
    toggleWalletDrawer = jest.fn()
    useOpenModal = jest.fn()
  })

  it('matches base snapshot', () => {
    mockUseFiatOnrampAvailability.mockImplementation(mockUseFiatOnRampsUnavailable)
    mockuseAccountDrawer.mockImplementation(() => [false, toggleWalletDrawer])
    const { asFragment } = render(<SwapBuyFiatButton />)
    expect(asFragment()).toMatchSnapshot()
  })

  it('fiat on ramps available in region, account unconnected', async () => {
    mockUseFiatOnrampAvailability.mockImplementation(mockUseFiatOnRampsAvailable)
    mockuseAccountDrawer.mockImplementation(() => [false, toggleWalletDrawer])
    mockUseOpenModal.mockImplementation(() => useOpenModal)
    render(<SwapBuyFiatButton />)
    await act(() => userEvent.click(screen.getByTestId('buy-fiat-button')))
    expect(toggleWalletDrawer).toHaveBeenCalledTimes(1)
    expect(screen.queryByTestId('fiat-on-ramp-unavailable-tooltip')).not.toBeInTheDocument()
  })

  it('fiat on ramps available in region, account connected', async () => {
    mocked(useWeb3React).mockReturnValue({
      account: '0x52270d8234b864dcAC9947f510CE9275A8a116Db',
      isActive: true,
    } as ReturnType<typeof useWeb3React>)
    mockUseFiatOnrampAvailability.mockImplementation(mockUseFiatOnRampsAvailable)
    mockuseAccountDrawer.mockImplementation(() => [false, toggleWalletDrawer])
    mockUseOpenModal.mockImplementation(() => useOpenModal)
    render(<SwapBuyFiatButton />)
    await act(() => userEvent.click(screen.getByTestId('buy-fiat-button')))
    expect(toggleWalletDrawer).toHaveBeenCalledTimes(0)
    expect(useOpenModal).toHaveBeenCalledTimes(1)
    expect(screen.queryByTestId('fiat-on-ramp-unavailable-tooltip')).not.toBeInTheDocument()
    expect(screen.queryByTestId('buy-fiat-flow-incomplete-indicator')).not.toBeInTheDocument()
  })

  it('fiat on ramps unavailable in region', async () => {
    mockUseFiatOnrampAvailability.mockImplementation(mockUseFiatOnRampsUnavailable)
    mockuseAccountDrawer.mockImplementation(() => [false, toggleWalletDrawer])
    render(<SwapBuyFiatButton />)
    await act(() => userEvent.click(screen.getByTestId('buy-fiat-button')))
    fireEvent.mouseOver(screen.getByTestId('buy-fiat-button'))
    expect(await screen.findByTestId('fiat-on-ramp-unavailable-tooltip')).toBeInTheDocument()
    expect(await screen.findByText(/Learn more/i)).toHaveAttribute('href', MOONPAY_REGION_AVAILABILITY_ARTICLE)
    expect(await screen.findByTestId('buy-fiat-button')).toBeDisabled()
  })
})
