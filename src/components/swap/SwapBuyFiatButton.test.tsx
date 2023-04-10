import userEvent from '@testing-library/user-event'
import { useWeb3React } from '@web3-react/core'
import { useAccountDrawer } from 'components/AccountDrawer'
import { fireEvent, render, screen } from 'test-utils'

import { useFiatOnrampAvailability, useOpenModal } from '../../state/application/hooks'
import SwapBuyFiatButton, { MOONPAY_REGION_AVAILABILITY_ARTICLE } from './SwapBuyFiatButton'

jest.mock('@web3-react/core', () => {
  const web3React = jest.requireActual('@web3-react/core')
  return {
    ...web3React,
    useWeb3React: jest.fn(),
  }
})

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
    toggleWalletDrawer = jest.fn()
    useOpenModal = jest.fn()
  })

  beforeEach(() => {
    jest.resetAllMocks()
    ;(useWeb3React as jest.Mock).mockReturnValue({
      account: undefined,
      isActive: false,
    })
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
    await userEvent.click(screen.getByTestId('buy-fiat-button'))
    expect(toggleWalletDrawer).toHaveBeenCalledTimes(1)
    expect(screen.queryByTestId('fiat-on-ramp-unavailable-tooltip')).not.toBeInTheDocument()
  })

  it('fiat on ramps available in region, account connected', async () => {
    ;(useWeb3React as jest.Mock).mockReturnValue({
      account: '0x52270d8234b864dcAC9947f510CE9275A8a116Db',
      isActive: true,
    })
    mockUseFiatOnrampAvailability.mockImplementation(mockUseFiatOnRampsAvailable)
    mockuseAccountDrawer.mockImplementation(() => [false, toggleWalletDrawer])
    mockUseOpenModal.mockImplementation(() => useOpenModal)
    render(<SwapBuyFiatButton />)
    expect(screen.getByTestId('buy-fiat-flow-incomplete-indicator')).toBeInTheDocument()
    await userEvent.click(screen.getByTestId('buy-fiat-button'))
    expect(toggleWalletDrawer).toHaveBeenCalledTimes(0)
    expect(useOpenModal).toHaveBeenCalledTimes(1)
    expect(screen.queryByTestId('fiat-on-ramp-unavailable-tooltip')).not.toBeInTheDocument()
    expect(screen.queryByTestId('buy-fiat-flow-incomplete-indicator')).not.toBeInTheDocument()
  })

  it('fiat on ramps unavailable in region', async () => {
    mockUseFiatOnrampAvailability.mockImplementation(mockUseFiatOnRampsUnavailable)
    mockuseAccountDrawer.mockImplementation(() => [false, toggleWalletDrawer])
    render(<SwapBuyFiatButton />)
    await userEvent.click(screen.getByTestId('buy-fiat-button'))
    fireEvent.mouseOver(screen.getByTestId('buy-fiat-button'))
    expect(await screen.findByTestId('fiat-on-ramp-unavailable-tooltip')).toBeInTheDocument()
    expect(await screen.findByText(/Learn more/i)).toHaveAttribute('href', MOONPAY_REGION_AVAILABILITY_ARTICLE)
    expect(await screen.findByTestId('buy-fiat-button')).toBeDisabled()
  })
})
