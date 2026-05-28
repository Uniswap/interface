import { fireEvent } from '@testing-library/react'
import { Page } from '~/components/NavBar/DownloadApp/Modal'
import { KeyManagementModal } from '~/components/NavBar/DownloadApp/Modal/KeyManagement'
import { render } from '~/test-utils/render'

vi.mock('~/hooks/useModalState', () => ({
  useModalState: vi.fn(() => ({ openModal: vi.fn(), isOpen: false, closeModal: vi.fn(), toggleModal: vi.fn() })),
}))

describe('KeyManagementModal', () => {
  const mockSetPage = vi.fn()
  const mockGoBack = vi.fn()
  const mockOnClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders correctly', () => {
    const { asFragment, getByText } = render(
      <KeyManagementModal setPage={mockSetPage} goBack={mockGoBack} onClose={mockOnClose} />,
    )
    expect(asFragment()).toMatchSnapshot()
    expect(getByText('Your wallet. Your crypto.')).toBeVisible()
  })

  it('renders Secured by text', () => {
    const { getByText } = render(<KeyManagementModal setPage={mockSetPage} goBack={mockGoBack} onClose={mockOnClose} />)
    expect(getByText('Secured by')).toBeVisible()
  })

  it('Continue button calls setPage(Page.PasskeyGeneration)', () => {
    const { getByRole } = render(<KeyManagementModal setPage={mockSetPage} goBack={mockGoBack} onClose={mockOnClose} />)
    fireEvent.click(getByRole('button', { name: 'Continue' }))
    expect(mockSetPage).toHaveBeenCalledWith(Page.PasskeyGeneration)
  })
})
