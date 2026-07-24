import { fireEvent } from '@testing-library/react'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { UnsupportedBrowserModal } from '~/components/Passkey/UnsupportedBrowserModal'
import { useModalState } from '~/hooks/useModalState'
import store from '~/state'
import { setCloseModal } from '~/state/application/reducer'
import { render, screen } from '~/test-utils/render'

vi.mock('~/hooks/useModalState', () => ({
  useModalState: vi.fn(),
}))

const mockCloseModal = vi.fn()

describe('UnsupportedBrowserModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    store.dispatch(setCloseModal())
    vi.mocked(useModalState).mockReturnValue({
      isOpen: true,
      closeModal: mockCloseModal,
      onClose: mockCloseModal,
      openModal: vi.fn(),
      toggleModal: vi.fn(),
    })
  })

  it('renders the unsupported-browser copy and both actions', () => {
    render(<UnsupportedBrowserModal />)

    expect(screen.getByText('Unsupported browser')).toBeInTheDocument()
    expect(
      screen.getByText('Try a different device/browser, or download the Uniswap wallet to continue.'),
    ).toBeInTheDocument()
    expect(screen.getByTestId(TestID.UnsupportedBrowserGetWallet)).toBeInTheDocument()
    expect(screen.getByTestId(TestID.UnsupportedBrowserClose)).toBeInTheDocument()
  })

  it('"Get Uniswap Wallet" opens the app-download modal on the QR (mobile) page', () => {
    render(<UnsupportedBrowserModal />)

    fireEvent.click(screen.getByTestId(TestID.UnsupportedBrowserGetWallet))

    expect(store.getState().application.openModal).toEqual({
      name: ModalName.GetTheApp,
      initialState: { initialInnerPage: 'mobile' },
    })
  })

  it('"Close" dismisses the modal', () => {
    render(<UnsupportedBrowserModal />)

    fireEvent.click(screen.getByTestId(TestID.UnsupportedBrowserClose))

    expect(mockCloseModal).toHaveBeenCalled()
  })
})
