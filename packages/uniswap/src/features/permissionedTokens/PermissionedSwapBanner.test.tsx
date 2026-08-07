import { fireEvent, screen } from '@testing-library/react'
import { PermissionedSwapBanner } from 'uniswap/src/features/permissionedTokens/PermissionedSwapBanner'
import { renderWithTheme } from 'uniswap/src/test/renderWithTheme'
import { CurrencyField } from 'uniswap/src/types/currency'

const { mockUseSwapFormStoreDerivedSwapInfo, mockUseActiveAccount, mockUsePermissionedSwapPair } = vi.hoisted(() => ({
  mockUseSwapFormStoreDerivedSwapInfo: vi.fn(),
  mockUseActiveAccount: vi.fn(),
  mockUsePermissionedSwapPair: vi.fn(),
}))

vi.mock('uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore', () => ({
  useSwapFormStoreDerivedSwapInfo: (selector: (s: unknown) => unknown) => mockUseSwapFormStoreDerivedSwapInfo(selector),
}))

vi.mock('uniswap/src/features/accounts/store/hooks', () => ({
  useActiveAccount: (...args: unknown[]) => mockUseActiveAccount(...args),
}))

vi.mock('uniswap/src/features/permissionedTokens/usePermissionedSwapPair', () => ({
  usePermissionedSwapPair: (...args: unknown[]) => mockUsePermissionedSwapPair(...args),
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => (opts?.['tokenSymbol'] ? `${key}:${opts['tokenSymbol']}` : key),
  }),
}))

vi.mock(
  'uniswap/src/features/permissionedTokens/PermissionedTokenInfoBottomSheet',
  async () => await import('uniswap/src/features/permissionedTokens/__mocks__/permissionedTokenInfoBottomSheetMock'),
)

function setupSwapStore(): void {
  mockUseSwapFormStoreDerivedSwapInfo.mockImplementation((selector: (s: unknown) => unknown) =>
    selector({
      currencies: {
        [CurrencyField.INPUT]: { currency: { chainId: 1, isNative: false, address: '0xTPT2', symbol: 'TPT2' } },
        [CurrencyField.OUTPUT]: { currency: { chainId: 1, isNative: true, symbol: 'ETH' } },
      },
      chainId: 1,
    }),
  )
}

describe('PermissionedSwapBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupSwapStore()
    mockUseActiveAccount.mockReturnValue({ address: '0xWallet' })
  })

  it('returns null when neither side is permissioned', () => {
    mockUsePermissionedSwapPair.mockReturnValue({
      isPermissioned: false,
      isAllowlisted: true,
      permissionedSymbol: undefined,
    })

    renderWithTheme(<PermissionedSwapBanner />)

    expect(screen.queryByText(/permissionedPool\.banner\.heading/)).toBeNull()
  })

  it('returns null when the wallet is allowlisted (happy path)', () => {
    mockUsePermissionedSwapPair.mockReturnValue({
      isPermissioned: true,
      isAllowlisted: true,
      permissionedSymbol: 'TPT2',
    })

    renderWithTheme(<PermissionedSwapBanner />)

    expect(screen.queryByText(/permissionedPool\.banner\.heading/)).toBeNull()
  })

  it('renders the banner with token symbol when permissioned and not allowlisted', () => {
    mockUsePermissionedSwapPair.mockReturnValue({
      isPermissioned: true,
      isAllowlisted: false,
      permissionedSymbol: 'TPT2',
    })

    renderWithTheme(<PermissionedSwapBanner />)

    expect(screen.getByText('permissionedPool.banner.heading:TPT2')).toBeTruthy()
    expect(screen.queryByTestId('info-sheet')).toBeNull()
  })

  it('opens the info bottom sheet on banner press', () => {
    mockUsePermissionedSwapPair.mockReturnValue({
      isPermissioned: true,
      isAllowlisted: false,
      permissionedSymbol: 'TPT2',
    })

    renderWithTheme(<PermissionedSwapBanner />)

    fireEvent.click(screen.getByText('permissionedPool.banner.heading:TPT2'))

    expect(screen.getByTestId('info-sheet')).toBeTruthy()
    expect(screen.getByTestId('info-sheet').textContent).toBe('TPT2')
  })

  it('falls back to empty token symbol when usePermissionedSwapPair returns undefined symbol', () => {
    mockUsePermissionedSwapPair.mockReturnValue({
      isPermissioned: true,
      isAllowlisted: false,
      permissionedSymbol: undefined,
    })

    renderWithTheme(<PermissionedSwapBanner />)

    expect(screen.getByText('permissionedPool.banner.heading')).toBeTruthy()
  })

  it('renders the output-side symbol when the permissioned token is on the buy side', () => {
    // The store has ETH on INPUT and a permissioned token on OUTPUT; the banner should
    // pull the symbol from usePermissionedSwapPair.permissionedSymbol regardless of side
    // (i.e., not interpolate currencies[INPUT].currency.symbol directly).
    mockUseSwapFormStoreDerivedSwapInfo.mockImplementation((selector: (s: unknown) => unknown) =>
      selector({
        currencies: {
          [CurrencyField.INPUT]: { currency: { chainId: 1, isNative: true, symbol: 'ETH' } },
          [CurrencyField.OUTPUT]: { currency: { chainId: 1, isNative: false, address: '0xSLINK', symbol: 'SLINK' } },
        },
        chainId: 1,
      }),
    )
    mockUsePermissionedSwapPair.mockReturnValue({
      isPermissioned: true,
      isAllowlisted: false,
      permissionedSymbol: 'SLINK',
    })

    renderWithTheme(<PermissionedSwapBanner />)

    expect(screen.getByText('permissionedPool.banner.heading:SLINK')).toBeTruthy()
  })
})
