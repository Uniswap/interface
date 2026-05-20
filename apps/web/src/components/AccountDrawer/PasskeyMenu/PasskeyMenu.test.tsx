import { QueryClient } from '@tanstack/react-query'
import { fireEvent, waitFor } from '@testing-library/react'
import type { PropsWithChildren, ReactNode } from 'react'
import { listAuthenticators } from 'uniswap/src/features/passkey/embeddedWallet'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { invalidateListAuthenticators, PasskeyMenu } from '~/components/AccountDrawer/PasskeyMenu/PasskeyMenu'
import { useEmbeddedWalletState } from '~/state/embeddedWallet/store'
import { render, screen } from '~/test-utils/render'

vi.mock('~/config', () => ({
  getConfig: vi.fn(() => ({ privyAppId: 'test-privy-app-id' })),
  getPrivyConfig: vi.fn(() => ({ appId: 'test-privy-app-id', clientId: 'test-privy-client-id' })),
  getPrivyAppId: vi.fn(() => 'test-privy-app-id'),
}))

vi.mock('uniswap/src/features/passkey/embeddedWallet', () => ({
  listAuthenticators: vi.fn(),
  authenticateWithPasskey: vi.fn(),
  AuthenticatorNameType: {
    ICLOUD_KEYCHAIN: 15,
    ICLOUD_KEYCHAIN_MANAGED: 4,
    CHROME_MAC: 2,
    GOOGLE_PASSWORD_MANAGER: 1,
    WINDOWS_HELLO: 3,
  },
  RecoveryMethod: vi.fn().mockImplementation((args: Record<string, unknown>) => args),
}))

vi.mock('~/state/embeddedWallet/store', async (importOriginal) => ({
  ...(await importOriginal<typeof import('~/state/embeddedWallet/store')>()),
  useEmbeddedWalletState: vi.fn(),
}))

const mockDispatch = vi.fn()
vi.mock('~/state/hooks', () => ({
  useAppDispatch: () => mockDispatch,
  useAppSelector: vi.fn(),
}))

vi.mock('ui/src/components/icons/IcloudPasswordLogo', () => ({
  IcloudPasswordLogo: () => <span data-testid="icloud-password-logo" />,
}))

vi.mock('~/components/AccountDrawer/SlideOutMenu', () => ({
  SlideOutMenu: ({ children, title }: PropsWithChildren<{ title: ReactNode }>) => (
    <div>
      <span>{title}</span>
      {children}
    </div>
  ),
}))

const mockAuthenticatorsDisplay = [
  {
    credentialId: 'cred-icloud-1',
    providerName: 15,
    createdAt: BigInt(1704110400000),
    aaguid: 'fbfc3007-154e-4ecc-8c0b-6e020557d7bd',
    provider: 'iCloud',
    label: 'iCloud',
  },
  {
    credentialId: 'cred-chrome-2',
    providerName: 2,
    createdAt: BigInt(1706788800000),
    aaguid: 'adce0002-35bc-c60a-648b-0b25f1f05503',
    provider: 'Chrome',
    label: 'Chrome',
  },
]

const MOCK_AUTHENTICATOR_NAME_TYPE = {
  ICLOUD_KEYCHAIN: 15,
  ICLOUD_KEYCHAIN_MANAGED: 4,
  CHROME_MAC: 2,
  GOOGLE_PASSWORD_MANAGER: 1,
  WINDOWS_HELLO: 3,
}

const mockRecoveryMethods = [
  {
    type: 'google',
    identifier: 'user@gmail.com',
    createdAt: '2024-01-15T00:00:00Z',
    status: 'active',
  },
]

// Sets up mocks so listAuthenticators resolves with data
function setupLoadedMock(recoveryMethods: typeof mockRecoveryMethods = []): void {
  vi.mocked(listAuthenticators).mockResolvedValue({
    authenticators: mockAuthenticatorsDisplay.map(({ credentialId, providerName, createdAt, aaguid }) => ({
      credentialId,
      providerName,
      createdAt,
      aaguid,
    })),
    recoveryMethods,
  } as never)
}

describe('PasskeyMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // PasskeyMenu logs an error when PRIVY_APP_ID is not set (always in test env)
    vi.spyOn(console, 'error').mockImplementation(() => {})
    // SVG icon components (IcloudPasswordLogo, Image) emit warnings in jsdom
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  it('shows 3 skeleton rows while loading', () => {
    vi.mocked(useEmbeddedWalletState).mockReturnValue({
      walletId: 'loading-test-wallet',
    } as ReturnType<typeof useEmbeddedWalletState>)
    // Never resolves so the component stays in loading state
    vi.mocked(listAuthenticators).mockReturnValue(new Promise(() => {}) as never)

    render(<PasskeyMenu onClose={vi.fn()} />)

    expect(document.body).toMatchSnapshot()
  })

  it('shows authenticators and Add passkey button after loading', async () => {
    vi.mocked(useEmbeddedWalletState).mockReturnValue({
      walletId: 'test-wallet-id',
    } as ReturnType<typeof useEmbeddedWalletState>)
    setupLoadedMock()

    render(<PasskeyMenu onClose={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByText('iCloud')).toBeInTheDocument()
      expect(screen.getByText('Chrome')).toBeInTheDocument()
    })

    expect(document.body).toMatchSnapshot()
  })

  it('shows overflow menu on authenticator rows', async () => {
    vi.mocked(useEmbeddedWalletState).mockReturnValue({
      walletId: 'test-wallet-id',
    } as ReturnType<typeof useEmbeddedWalletState>)
    setupLoadedMock()

    render(<PasskeyMenu onClose={vi.fn()} />)
    await screen.findByText('iCloud')

    // Each AuthenticatorRow renders a "..." overflow menu button
    const overflowButtons = screen.getAllByTestId(TestID.DeletePasskey)
    expect(overflowButtons).toHaveLength(2)
  })

  it('hides delete overflow menu when only one passkey exists', async () => {
    vi.mocked(useEmbeddedWalletState).mockReturnValue({
      walletId: 'test-wallet-single-passkey',
    } as ReturnType<typeof useEmbeddedWalletState>)
    vi.mocked(listAuthenticators).mockResolvedValue({
      authenticators: [
        {
          credentialId: mockAuthenticatorsDisplay[0].credentialId,
          providerName: mockAuthenticatorsDisplay[0].providerName,
          createdAt: mockAuthenticatorsDisplay[0].createdAt,
          aaguid: mockAuthenticatorsDisplay[0].aaguid,
        },
      ],
      recoveryMethods: [],
    } as never)

    render(<PasskeyMenu onClose={vi.fn()} />)
    await screen.findByText('iCloud')

    expect(screen.queryByTestId(TestID.DeletePasskey)).not.toBeInTheDocument()
  })

  it('dispatches setOpenModal(AddPasskey) when Add passkey button is pressed', async () => {
    vi.mocked(useEmbeddedWalletState).mockReturnValue({
      walletId: 'test-wallet-id',
    } as ReturnType<typeof useEmbeddedWalletState>)
    setupLoadedMock()

    render(<PasskeyMenu onClose={vi.fn()} />)
    await screen.findByText('iCloud')

    fireEvent.click(screen.getByText('Add a passkey'))

    expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({ payload: { name: ModalName.AddPasskey } }))
  })

  it('dispatches setOpenModal(DeletePasskey) when overflow menu Remove is clicked', async () => {
    vi.mocked(useEmbeddedWalletState).mockReturnValue({
      walletId: 'test-wallet-id',
    } as ReturnType<typeof useEmbeddedWalletState>)
    setupLoadedMock()

    render(<PasskeyMenu onClose={vi.fn()} />)
    await screen.findByText('iCloud')

    // Click opens the Popover; menu content renders into a Portal under document.body.
    const overflowButtons = screen.getAllByTestId(TestID.DeletePasskey)
    fireEvent.click(overflowButtons[0])

    // Click "Remove" in the popover
    fireEvent.click(await screen.findByText('Remove'))

    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          name: ModalName.DeletePasskey,
          initialState: expect.objectContaining({
            authenticatorId: 'cred-icloud-1',
            isLastAuthenticator: false,
          }),
        }),
      }),
    )
  })

  it('shows recovery method with correct label and identifier', async () => {
    vi.mocked(useEmbeddedWalletState).mockReturnValue({
      walletId: 'test-wallet-recovery-label',
    } as ReturnType<typeof useEmbeddedWalletState>)
    setupLoadedMock(mockRecoveryMethods)

    render(<PasskeyMenu onClose={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByText('Google')).toBeInTheDocument()
      expect(screen.getByText('user@gmail.com')).toBeInTheDocument()
    })
  })

  it('shows overflow menu on recovery method row', async () => {
    vi.mocked(useEmbeddedWalletState).mockReturnValue({
      walletId: 'test-wallet-recovery-menu',
    } as ReturnType<typeof useEmbeddedWalletState>)
    setupLoadedMock(mockRecoveryMethods)

    render(<PasskeyMenu onClose={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByText('Google')).toBeInTheDocument()
    })

    // Recovery method row should have its own overflow menu with a testID
    expect(screen.getByTestId(TestID.RemoveBackupLoginOverflow)).toBeInTheDocument()
  })

  it('dispatches setOpenModal(RemoveBackupLogin) when recovery method overflow Remove is clicked', async () => {
    vi.mocked(useEmbeddedWalletState).mockReturnValue({
      walletId: 'test-wallet-remove-backup',
    } as ReturnType<typeof useEmbeddedWalletState>)
    setupLoadedMock(mockRecoveryMethods)

    render(<PasskeyMenu onClose={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByText('Google')).toBeInTheDocument()
    })

    // Click opens the Popover; menu content renders into a Portal under document.body.
    fireEvent.click(screen.getByTestId(TestID.RemoveBackupLoginOverflow))

    // Click "Remove" in the popover
    fireEvent.click(await screen.findByText('Remove'))

    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          name: ModalName.RemoveBackupLogin,
          initialState: expect.objectContaining({
            recoveryMethodType: 'google',
            recoveryMethodIdentifier: 'user@gmail.com',
          }),
        }),
      }),
    )
  })

  it('hides "Add a backup login" button when recovery methods exist', async () => {
    vi.mocked(useEmbeddedWalletState).mockReturnValue({
      walletId: 'test-wallet-hide-add-backup',
    } as ReturnType<typeof useEmbeddedWalletState>)
    setupLoadedMock(mockRecoveryMethods)

    render(<PasskeyMenu onClose={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByText('Google')).toBeInTheDocument()
    })
    expect(screen.queryByText('Add a login')).not.toBeInTheDocument()
  })

  it('shows "Add a backup login" button when recovery methods is empty', async () => {
    vi.mocked(useEmbeddedWalletState).mockReturnValue({
      // Use a different walletId to avoid react-query cache from other tests
      walletId: 'test-wallet-no-recovery',
    } as ReturnType<typeof useEmbeddedWalletState>)
    setupLoadedMock([])

    render(<PasskeyMenu onClose={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByText('iCloud')).toBeInTheDocument()
    })
    expect(screen.getByText('Backup login')).toBeInTheDocument()
    expect(screen.queryByText('user@gmail.com')).not.toBeInTheDocument()
  })
})

describe('invalidateListAuthenticators', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('removes the sessionStorage mirror and invalidates the query', async () => {
    sessionStorage.setItem('listAuth:wallet-1', JSON.stringify({ authenticators: [], recoveryMethods: [] }))
    const queryClient = new QueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    await invalidateListAuthenticators(queryClient, 'wallet-1')

    expect(sessionStorage.getItem('listAuth:wallet-1')).toBeNull()
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: [ReactQueryCacheKey.ListAuthenticators] })
  })

  it('handles a null walletId by clearing the empty-suffix sessionStorage key', async () => {
    sessionStorage.setItem('listAuth:', JSON.stringify({ authenticators: [], recoveryMethods: [] }))
    const queryClient = new QueryClient()

    await invalidateListAuthenticators(queryClient, null)

    expect(sessionStorage.getItem('listAuth:')).toBeNull()
  })
})
