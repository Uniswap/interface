import { act, fireEvent } from '@testing-library/react'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { PasskeyGenerationModal } from '~/components/NavBar/DownloadApp/Modal/PasskeyGeneration'
import { useSignInWithPasskey } from '~/hooks/useSignInWithPasskey'
import { mocked } from '~/test-utils/mocked'
import { render } from '~/test-utils/render'

vi.mock('~/hooks/useSignInWithPasskey', () => ({
  useSignInWithPasskey: vi.fn(),
}))

vi.mock('~/hooks/useModalState', () => ({
  useModalState: vi.fn(() => ({ openModal: vi.fn(), isOpen: false, closeModal: vi.fn(), toggleModal: vi.fn() })),
}))

function getDefaultProps() {
  return {
    unitag: 'testuser',
    setPage: vi.fn(),
    onClose: vi.fn(),
    goBack: vi.fn(),
  }
}

describe('PasskeyGenerationModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocked(useSignInWithPasskey).mockReturnValue({
      signInWithPasskey: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useSignInWithPasskey>)
  })

  it('renders default state', () => {
    const { asFragment, getByTestId } = render(<PasskeyGenerationModal {...getDefaultProps()} />)
    expect(asFragment()).toMatchSnapshot()
    expect(getByTestId(TestID.CreatePasskey)).toBeVisible()
  })

  it('renders loading state', () => {
    mocked(useSignInWithPasskey).mockReturnValue({
      signInWithPasskey: vi.fn(),
      isPending: true,
    } as unknown as ReturnType<typeof useSignInWithPasskey>)

    const { asFragment, getByText } = render(<PasskeyGenerationModal {...getDefaultProps()} />)
    expect(asFragment()).toMatchSnapshot()
    expect(getByText('Creating passkey')).toBeVisible()
  })

  it('renders success state after sign in', async () => {
    vi.useFakeTimers()

    let capturedOnSuccess: (() => Promise<void>) | undefined
    mocked(useSignInWithPasskey).mockImplementation(({ onSuccess }: any) => {
      capturedOnSuccess = onSuccess
      return {
        signInWithPasskey: vi.fn(() => {
          capturedOnSuccess?.()
        }),
        isPending: false,
      } as unknown as ReturnType<typeof useSignInWithPasskey>
    })

    const { getByTestId, getByText } = render(<PasskeyGenerationModal {...getDefaultProps()} />)

    await act(async () => {
      fireEvent.click(getByTestId(TestID.CreatePasskey))
    })

    expect(getByText('Passkey created')).toBeVisible()

    vi.useRealTimers()
  })

  it('calls signInWithPasskey when button is clicked', () => {
    const mockSignInWithPasskey = vi.fn()
    mocked(useSignInWithPasskey).mockReturnValue({
      signInWithPasskey: mockSignInWithPasskey,
      isPending: false,
    } as unknown as ReturnType<typeof useSignInWithPasskey>)

    const { getByTestId } = render(<PasskeyGenerationModal {...getDefaultProps()} />)
    fireEvent.click(getByTestId(TestID.CreatePasskey))
    expect(mockSignInWithPasskey).toHaveBeenCalled()
  })
})
