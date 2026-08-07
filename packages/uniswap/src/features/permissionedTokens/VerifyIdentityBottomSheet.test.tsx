const { mockOpenUri, mockUseSwapFormStoreDerivedSwapInfo, mockUsePermissionedSwapPair, mockUseActiveAccount } =
  vi.hoisted(() => ({
    mockOpenUri: vi.fn().mockResolvedValue(undefined),
    mockUseSwapFormStoreDerivedSwapInfo: vi.fn(),
    mockUsePermissionedSwapPair: vi.fn(),
    mockUseActiveAccount: vi.fn(),
  }))

vi.mock('uniswap/src/utils/linking', () => ({
  openUri: mockOpenUri,
}))

vi.mock('uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore', () => ({
  useSwapFormStoreDerivedSwapInfo: mockUseSwapFormStoreDerivedSwapInfo,
}))

vi.mock('uniswap/src/features/permissionedTokens/usePermissionedSwapPair', () => ({
  usePermissionedSwapPair: mockUsePermissionedSwapPair,
}))

vi.mock('uniswap/src/features/accounts/store/hooks', () => ({
  useActiveAccount: mockUseActiveAccount,
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (opts?.['tokenSymbol'] || opts?.['provider']) {
        const suffix = [opts['tokenSymbol'], opts['provider']].filter(Boolean).join(':')
        return `${key}:${suffix}`
      }
      return key
    },
  }),
}))

// Modal renders as BottomSheetModal on native; mock as a portal-free pass-through so
// JSDOM can find the children.
vi.mock('uniswap/src/components/modals/Modal', () => ({
  Modal: ({ children, isModalOpen }: { children: React.ReactNode; isModalOpen: boolean }) =>
    isModalOpen ? <div data-testid="mock-modal">{children}</div> : null,
}))

import { fireEvent, screen } from '@testing-library/react'
import { VerifyIdentityBottomSheet } from 'uniswap/src/features/permissionedTokens/VerifyIdentityBottomSheet'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { renderWithTheme } from 'uniswap/src/test/renderWithTheme'
import { CurrencyField } from 'uniswap/src/types/currency'

const ETHEREUM_CHAIN_ID = 1
const REGISTRATION_URL = 'https://superstate.com/register'

function setupSwapStore({ chainId = ETHEREUM_CHAIN_ID }: { chainId?: number } = {}) {
  // SUT calls the hook with a selector — mock by running the selector against the
  // store snapshot so we mirror real behavior (mirrors PermissionedSwapBanner.test.tsx:50).
  mockUseSwapFormStoreDerivedSwapInfo.mockImplementation((selector: (s: unknown) => unknown) =>
    selector({
      chainId,
      currencies: {
        [CurrencyField.INPUT]: {
          currency: {
            chainId,
            isNative: false,
            isToken: true,
            address: '0x0000000000000000000000000000000000534c4e',
            symbol: 'SLINK',
          },
        },
        [CurrencyField.OUTPUT]: {
          currency: {
            chainId,
            isNative: true,
            symbol: 'ETH',
          },
        },
      },
    }),
  )
}

describe('VerifyIdentityBottomSheet', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupSwapStore()
    mockUsePermissionedSwapPair.mockReturnValue({
      permissionedSide: 'input',
      permissionedAddress: '0x0000000000000000000000000000000000534c4e',
      permissionedChainId: ETHEREUM_CHAIN_ID,
      permissionedSymbol: 'SLINK',
      isPermissioned: true,
      isAllowlisted: false,
      isLoading: false,
      kycUrl: REGISTRATION_URL,
      issuer: 'Superstate',
    })
    mockUseActiveAccount.mockReturnValue({ address: '0xWallet' })
  })

  it('renders with the permissioned token symbol when isOpen and not allowlisted', () => {
    renderWithTheme(<VerifyIdentityBottomSheet isOpen onClose={vi.fn()} />)

    expect(screen.getByTestId(TestID.VerifyIdentityModal)).toBeTruthy()
    // The banner heading lives in `PermissionedSwapBanner` now; the bottom sheet just
    // renders the verifyIdentity title + description (with tokenSymbol + provider
    // interpolated by the t() mock above).
    expect(screen.getByText('permissionedPool.verifyIdentity.title')).toBeTruthy()
    expect(screen.getByText(/permissionedPool\.verifyIdentity\.description:SLINK:Superstate/)).toBeTruthy()
  })

  it('returns null when isOpen is false', () => {
    renderWithTheme(<VerifyIdentityBottomSheet isOpen={false} onClose={vi.fn()} />)

    expect(screen.queryByTestId(TestID.VerifyIdentityModal)).toBeNull()
  })

  it('returns null when the user is already allowlisted', () => {
    mockUsePermissionedSwapPair.mockReturnValue({
      permissionedSide: 'input',
      permissionedAddress: '0x0000000000000000000000000000000000534c4e',
      permissionedChainId: ETHEREUM_CHAIN_ID,
      permissionedSymbol: 'SLINK',
      isPermissioned: true,
      isAllowlisted: true,
      isLoading: false,
      kycUrl: undefined,
      issuer: 'Superstate',
    })

    renderWithTheme(<VerifyIdentityBottomSheet isOpen onClose={vi.fn()} />)

    expect(screen.queryByTestId(TestID.VerifyIdentityModal)).toBeNull()
  })

  it('returns null when neither side of the swap is permissioned', () => {
    mockUsePermissionedSwapPair.mockReturnValue({
      permissionedSide: undefined,
      permissionedAddress: undefined,
      permissionedChainId: undefined,
      permissionedSymbol: undefined,
      isPermissioned: false,
      isAllowlisted: true,
      isLoading: false,
      kycUrl: undefined,
      issuer: undefined,
    })

    renderWithTheme(<VerifyIdentityBottomSheet isOpen onClose={vi.fn()} />)

    expect(screen.queryByTestId(TestID.VerifyIdentityModal)).toBeNull()
  })

  it('opens the registration URL and calls onClose when Proceed is pressed', () => {
    const onClose = vi.fn()
    renderWithTheme(<VerifyIdentityBottomSheet isOpen onClose={onClose} />)

    fireEvent.click(screen.getByTestId(TestID.VerifyIdentityButton))

    expect(mockOpenUri).toHaveBeenCalledWith({
      uri: REGISTRATION_URL,
      openExternalBrowser: true,
    })
    expect(onClose).toHaveBeenCalled()
  })

  it('renders the Learn more link', () => {
    renderWithTheme(<VerifyIdentityBottomSheet isOpen onClose={vi.fn()} />)

    expect(screen.getByText('permissionedPool.verifyIdentity.learnMore')).toBeTruthy()
  })

  it('renders the legal disclaimer', () => {
    renderWithTheme(<VerifyIdentityBottomSheet isOpen onClose={vi.fn()} />)

    expect(screen.getByText(/permissionedPool\.verifyIdentity\.disclaimer:Superstate/)).toBeTruthy()
  })

  it('renders the unavailable fallback (not blank provider copy) when issuer is undefined', () => {
    mockUsePermissionedSwapPair.mockReturnValue({
      permissionedSide: 'input',
      permissionedAddress: '0x0000000000000000000000000000000000534c4e',
      permissionedChainId: ETHEREUM_CHAIN_ID,
      permissionedSymbol: 'SLINK',
      isPermissioned: true,
      isAllowlisted: false,
      isLoading: false,
      kycUrl: REGISTRATION_URL,
      issuer: undefined,
    })

    renderWithTheme(<VerifyIdentityBottomSheet isOpen onClose={vi.fn()} />)

    expect(screen.getByTestId(TestID.VerifyIdentityUnavailableModal)).toBeTruthy()
    expect(screen.queryByTestId(TestID.VerifyIdentityModal)).toBeNull()
    // No provider-dependent copy should render with a blank provider.
    expect(screen.queryByText(/permissionedPool\.verifyIdentity\.disclaimer/)).toBeNull()
  })

  it('renders the unavailable fallback when issuer is an empty string', () => {
    mockUsePermissionedSwapPair.mockReturnValue({
      permissionedSide: 'input',
      permissionedAddress: '0x0000000000000000000000000000000000534c4e',
      permissionedChainId: ETHEREUM_CHAIN_ID,
      permissionedSymbol: 'SLINK',
      isPermissioned: true,
      isAllowlisted: false,
      isLoading: false,
      kycUrl: REGISTRATION_URL,
      issuer: '',
    })

    renderWithTheme(<VerifyIdentityBottomSheet isOpen onClose={vi.fn()} />)

    expect(screen.getByTestId(TestID.VerifyIdentityUnavailableModal)).toBeTruthy()
    expect(screen.queryByTestId(TestID.VerifyIdentityModal)).toBeNull()
  })

  it('renders the unavailable fallback when kycUrl is missing', () => {
    mockUsePermissionedSwapPair.mockReturnValue({
      permissionedSide: 'input',
      permissionedAddress: '0x0000000000000000000000000000000000534c4e',
      permissionedChainId: ETHEREUM_CHAIN_ID,
      permissionedSymbol: 'SLINK',
      isPermissioned: true,
      isAllowlisted: false,
      isLoading: false,
      kycUrl: undefined,
      issuer: 'Superstate',
    })

    renderWithTheme(<VerifyIdentityBottomSheet isOpen onClose={vi.fn()} />)

    expect(screen.getByTestId(TestID.VerifyIdentityUnavailableModal)).toBeTruthy()
    expect(screen.queryByTestId(TestID.VerifyIdentityModal)).toBeNull()
  })
})
