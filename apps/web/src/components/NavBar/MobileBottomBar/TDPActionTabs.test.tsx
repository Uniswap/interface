import { fireEvent, render, screen } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { TamaguiProvider } from 'ui/src'
import config from 'ui/src/tamagui.config'
import { TDPActionTabs } from '~/components/NavBar/MobileBottomBar/TDPActionTabs'

const {
  mockUseTDPStore,
  mockUseActiveAccount,
  mockUseAccount,
  mockUseTokenKYCStatus,
  mockUseModalState,
  mockUseSelectChain,
  mockNavigate,
  mockUseMedia,
} = vi.hoisted(() => ({
  mockUseTDPStore: vi.fn(),
  mockUseActiveAccount: vi.fn(),
  mockUseAccount: vi.fn(),
  mockUseTokenKYCStatus: vi.fn(),
  mockUseModalState: vi.fn(),
  mockUseSelectChain: vi.fn(),
  mockNavigate: vi.fn(),
  mockUseMedia: vi.fn(),
}))

vi.mock('react-router', () => ({
  useNavigate: () => mockNavigate,
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

vi.mock('ui/src', async (importOriginal) => {
  const actual = await importOriginal<typeof import('ui/src')>()
  return {
    ...actual,
    useMedia: () => mockUseMedia(),
  }
})

vi.mock('~/pages/TokenDetails/context/useTDPStore', () => ({
  useTDPStore: (selector: (s: unknown) => unknown) => mockUseTDPStore(selector),
}))

vi.mock('~/features/accounts/store/hooks', () => ({
  useActiveAccount: (...args: unknown[]) => mockUseActiveAccount(...args),
}))

vi.mock('~/hooks/useAccount', () => ({
  useAccount: () => mockUseAccount(),
}))

vi.mock('uniswap/src/features/permissionedTokens/useTokenKYCStatus', () => ({
  useTokenKYCStatus: (...args: unknown[]) => mockUseTokenKYCStatus(...args),
}))

vi.mock('~/hooks/useModalState', () => ({
  useModalState: (...args: unknown[]) => mockUseModalState(...args),
}))

vi.mock('~/hooks/useSelectChain', () => ({
  useSelectChain: () => mockUseSelectChain,
}))

// TDPActionTabs no longer mounts VerifyIdentityModal directly; the shared mount lives in
// TDPSwapComponent (TokenDetails always renders both, so a single mount avoids double
// portals). This test asserts on the openModal dispatch, not the modal render.

function ThemeWrapper({ children }: PropsWithChildren): JSX.Element {
  return (
    <TamaguiProvider config={config} defaultTheme="light">
      {children}
    </TamaguiProvider>
  )
}

const renderWithTheme = (ui: React.ReactElement): ReturnType<typeof render> => render(ui, { wrapper: ThemeWrapper })

const TPT2_ADDRESS = '0x7b7c6a29368eebe78bfab9eae09d958da5cad9a4'
const ETHEREUM = 1

function setupStore(overrides: Record<string, unknown> = {}): void {
  mockUseTDPStore.mockImplementation((selector: (s: unknown) => unknown) =>
    selector({
      currencyChain: 'ethereum',
      currencyChainId: ETHEREUM,
      address: TPT2_ADDRESS,
      tokenColor: undefined,
      multiChainMap: { ethereum: { balance: undefined } },
      currency: { chainId: ETHEREUM, isNative: false, address: TPT2_ADDRESS, symbol: 'TPT2' },
      ...overrides,
    }),
  )
}

function setupDefaults(): void {
  setupStore()
  mockUseActiveAccount.mockReturnValue({ chainId: ETHEREUM })
  mockUseAccount.mockReturnValue({ address: '0xWallet' })
  mockUseTokenKYCStatus.mockReturnValue({
    isPermissioned: false,
    isAllowlisted: true,
    kycUrl: undefined,
    issuer: undefined,
  })
  mockUseModalState.mockReturnValue({ openModal: vi.fn(), closeModal: vi.fn(), isOpen: false })
  mockUseMedia.mockReturnValue({ xs: false })
}

describe('TDPActionTabs — permissioned gating', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupDefaults()
  })

  it('renders the Verify Identity button instead of Buy/Sell tabs when the wallet is denied', () => {
    mockUseTokenKYCStatus.mockReturnValue({
      isPermissioned: true,
      isAllowlisted: false,
      kycUrl: 'https://kyc.example/start',
      issuer: 'Superstate',
    })

    renderWithTheme(<TDPActionTabs />)

    expect(screen.getByText('permissionedPool.verifyIdentity.cta')).toBeTruthy()
    expect(screen.queryByText('common.buy.label')).toBeNull()
    expect(screen.queryByText('common.sell.label')).toBeNull()
  })

  it('binds the Verify Identity button press to openModal (and not the close handler)', () => {
    const openModal = vi.fn()
    const closeModal = vi.fn()
    mockUseModalState.mockReturnValue({ openModal, closeModal, isOpen: false })
    mockUseTokenKYCStatus.mockReturnValue({
      isPermissioned: true,
      isAllowlisted: false,
      kycUrl: 'https://kyc.example/start',
      issuer: 'Superstate',
    })

    renderWithTheme(<TDPActionTabs />)

    fireEvent.click(screen.getByText('permissionedPool.verifyIdentity.cta'))

    expect(openModal).toHaveBeenCalledTimes(1)
    // Guards against a future refactor accidentally wiring the press handler to close
    // instead of open (production uses the same `useModalState` for both directions).
    expect(closeModal).not.toHaveBeenCalled()
  })

  it('renders normal Buy tab when the token is not permissioned', () => {
    mockUseTokenKYCStatus.mockReturnValue({
      isPermissioned: false,
      isAllowlisted: true,
      kycUrl: undefined,
      issuer: undefined,
    })

    renderWithTheme(<TDPActionTabs />)

    expect(screen.getByText('common.buy.label')).toBeTruthy()
    expect(screen.queryByText('permissionedPool.verifyIdentity.cta')).toBeNull()
  })

  it('renders normal Buy/Sell tabs when wallet is allowlisted and has balance', () => {
    setupStore({ multiChainMap: { ethereum: { balance: '100' } } })
    mockUseTokenKYCStatus.mockReturnValue({
      isPermissioned: true,
      isAllowlisted: true,
      kycUrl: undefined,
      issuer: 'Superstate',
    })

    renderWithTheme(<TDPActionTabs />)

    expect(screen.getByText('common.buy.label')).toBeTruthy()
    expect(screen.getByText('common.sell.label')).toBeTruthy()
    expect(screen.queryByText('permissionedPool.verifyIdentity.cta')).toBeNull()
  })

  it('renders normal Buy tab when no wallet is connected (connect-wallet UX defers)', () => {
    mockUseAccount.mockReturnValue({ address: undefined })
    mockUseTokenKYCStatus.mockReturnValue({
      // The hook itself overrides isAllowlisted=true pre-wallet; replicate that here.
      isPermissioned: true,
      isAllowlisted: true,
      kycUrl: undefined,
      issuer: 'Superstate',
    })

    renderWithTheme(<TDPActionTabs />)

    expect(screen.getByText('common.buy.label')).toBeTruthy()
    expect(screen.queryByText('permissionedPool.verifyIdentity.cta')).toBeNull()
  })
})
