import { fireEvent } from '@testing-library/react'
import { hasActiveNeckKey } from 'uniswap/src/features/passkey/deviceSession'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { useListAuthenticatorsQuery } from '~/components/AccountDrawer/PasskeyMenu/hooks/useListAuthenticatorsQuery'
import { TroubleLoggingInModule } from '~/components/NavBar/DownloadApp/Modal/TroubleLoggingInModule'
import { useIsEmbeddedWallet } from '~/hooks/useIsEmbeddedWallet'
import { useEmbeddedWalletState } from '~/state/embeddedWallet/store'
import { render, screen } from '~/test-utils/render'

vi.mock('~/hooks/useIsEmbeddedWallet', () => ({
  useIsEmbeddedWallet: vi.fn(),
}))

const mockDispatch = vi.fn()
vi.mock('~/state/hooks', () => ({
  useAppDispatch: () => mockDispatch,
  useAppSelector: vi.fn(),
}))

vi.mock('~/components/AccountDrawer/PasskeyMenu/hooks/useListAuthenticatorsQuery', () => ({
  useListAuthenticatorsQuery: vi.fn(),
}))

vi.mock('~/state/embeddedWallet/store', async (importOriginal) => ({
  ...(await importOriginal<typeof import('~/state/embeddedWallet/store')>()),
  useEmbeddedWalletState: vi.fn(),
}))

vi.mock('uniswap/src/features/passkey/deviceSession', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/features/passkey/deviceSession')>()),
  hasActiveNeckKey: vi.fn(),
}))

function mockAuthenticatorsQuery(result: {
  recoveryMethods?: { type: string }[]
  isLoading?: boolean
  isError?: boolean
}): void {
  vi.mocked(useListAuthenticatorsQuery).mockReturnValue({
    data: result.recoveryMethods ? { authenticators: [], recoveryMethods: result.recoveryMethods } : undefined,
    isLoading: result.isLoading ?? false,
    isError: result.isError ?? false,
  } as never)
}

function renderExpanded(): void {
  render(<TroubleLoggingInModule />)
  fireEvent.click(screen.getByText('Trouble logging in?'))
}

describe('TroubleLoggingInModule', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useIsEmbeddedWallet).mockReturnValue(true)
    vi.mocked(useEmbeddedWalletState).mockReturnValue({ walletId: 'test-wallet' } as ReturnType<
      typeof useEmbeddedWalletState
    >)
    vi.mocked(hasActiveNeckKey).mockReturnValue(true)
    mockAuthenticatorsQuery({ recoveryMethods: [] })
  })

  it('renders nothing when the user is not on an embedded wallet', () => {
    vi.mocked(useIsEmbeddedWallet).mockReturnValue(false)
    render(<TroubleLoggingInModule />)
    expect(screen.queryByTestId(TestID.DownloadAppLoginHelp)).not.toBeInTheDocument()
  })

  it('renders collapsed with the header and no options', () => {
    render(<TroubleLoggingInModule />)
    expect(screen.getByText('Trouble logging in?')).toBeVisible()
    expect(screen.queryByTestId(TestID.DownloadAppAddPasskey)).not.toBeInTheDocument()
    expect(screen.queryByTestId(TestID.DownloadAppAddBackupLogin)).not.toBeInTheDocument()
  })

  it('expands to reveal both options when no recovery method exists', () => {
    renderExpanded()
    expect(screen.getByText('Add a passkey')).toBeInTheDocument()
    expect(screen.getByText('Add a backup login')).toBeInTheDocument()
  })

  it('hides the backup login option when a recovery method already exists', () => {
    mockAuthenticatorsQuery({ recoveryMethods: [{ type: 'google' }] })
    renderExpanded()
    expect(screen.getByTestId(TestID.DownloadAppAddPasskey)).toBeInTheDocument()
    expect(screen.queryByTestId(TestID.DownloadAppAddBackupLogin)).not.toBeInTheDocument()
  })

  it('fails closed: hides the backup login option when the listAuthenticators response is unavailable', () => {
    mockAuthenticatorsQuery({})
    renderExpanded()
    expect(screen.queryByTestId(TestID.DownloadAppAddBackupLogin)).not.toBeInTheDocument()
  })

  it('fails closed: hides the backup login option when listAuthenticators errors', () => {
    mockAuthenticatorsQuery({ isError: true })
    renderExpanded()
    expect(screen.queryByTestId(TestID.DownloadAppAddBackupLogin)).not.toBeInTheDocument()
  })

  it('dispatches setOpenModal(AddPasskey) when the passkey option is pressed', () => {
    renderExpanded()
    fireEvent.click(screen.getByTestId(TestID.DownloadAppAddPasskey))
    expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({ payload: { name: ModalName.AddPasskey } }))
  })

  it('dispatches setOpenModal(AddBackupLogin) when the backup login option is pressed', () => {
    renderExpanded()
    fireEvent.click(screen.getByTestId(TestID.DownloadAppAddBackupLogin))
    expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({ payload: { name: ModalName.AddBackupLogin } }))
  })
})
