import { TestID } from '@universe/test'
import type { FORServiceProvider } from 'uniswap/src/features/fiatOnRamp/types'
import { AddFundsModal } from '~/components/AddFundsModal/AddFundsModal'
import { useAddFundsActions } from '~/components/emptyWallet/AddFundsOptions'
import { useCexTransferProviderPress } from '~/hooks/useCexTransferProviderPress'
import { useModalState } from '~/hooks/useModalState'
import { mocked } from '~/test-utils/mocked'
import { fireEvent, render, screen } from '~/test-utils/render'

vi.mock('~/hooks/useModalState', () => ({
  useModalState: vi.fn(),
}))

vi.mock('~/components/emptyWallet/AddFundsOptions', () => ({
  useAddFundsActions: vi.fn(),
}))

vi.mock('~/hooks/useCexTransferProviderPress', () => ({
  useCexTransferProviderPress: vi.fn(),
}))

const closeModal = vi.fn()
const onBuy = vi.fn()
const onReceive = vi.fn()
const openCexTransferProviderList = vi.fn()
const onProviderPress = vi.fn()

const coinbase = { serviceProvider: 'COINBASE', name: 'Coinbase', logos: {} } as unknown as FORServiceProvider
const robinhood = { serviceProvider: 'ROBINHOOD', name: 'Robinhood', logos: {} } as unknown as FORServiceProvider

function mockActions(providers: FORServiceProvider[]): void {
  mocked(useAddFundsActions).mockReturnValue({
    providers,
    onBuy,
    onReceive,
    openCexTransferProviderList,
  })
}

function mockModalState(isOpen: boolean): void {
  mocked(useModalState).mockReturnValue({
    isOpen,
    openModal: vi.fn(),
    closeModal,
    onClose: closeModal,
    toggleModal: vi.fn(),
  })
}

describe('AddFundsModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockModalState(true)
    mocked(useCexTransferProviderPress).mockReturnValue({ onPress: onProviderPress, isLoading: false })
  })

  it('renders nothing when closed', () => {
    mockModalState(false)
    mockActions([])

    render(<AddFundsModal />)

    expect(screen.queryByText('Add funds to start trading')).toBeNull()
  })

  it('closes itself before navigating to buy', () => {
    mockActions([])

    render(<AddFundsModal />)
    fireEvent.click(screen.getByTestId(TestID.AddFundsBuy))

    expect(closeModal).toHaveBeenCalled()
    expect(onBuy).toHaveBeenCalled()
  })

  it('opens the receive flow', () => {
    mockActions([])

    render(<AddFundsModal />)
    fireEvent.click(screen.getByTestId(TestID.AddFundsReceive))

    expect(onReceive).toHaveBeenCalled()
  })

  it('hides the account section when there are no providers', () => {
    mockActions([])

    render(<AddFundsModal />)

    expect(screen.queryByText('Transfer from an account')).toBeNull()
  })

  it('renders one card per CEX provider', () => {
    mockActions([coinbase, robinhood])

    render(<AddFundsModal />)
    fireEvent.click(screen.getByText('Robinhood'))

    expect(screen.getByText('Transfer from an account')).toBeInTheDocument()
    expect(screen.getByText('Coinbase')).toBeInTheDocument()
    expect(onProviderPress).toHaveBeenCalled()
  })
})
