import { fireEvent, screen } from '@testing-library/react'
import { SwapFormPermissionedWarningCard } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapFormScreenDetails/SwapFormPermissionedWarningCard'
import { renderWithTheme } from 'uniswap/src/test/renderWithTheme'
import { CurrencyField } from 'uniswap/src/types/currency'

const { mockUseSwapFormStoreDerivedSwapInfo, mockUseActiveAccount, mockUsePermissionedSwapPair } = vi.hoisted(() => ({
  mockUseSwapFormStoreDerivedSwapInfo: vi.fn(),
  mockUseActiveAccount: vi.fn(),
  mockUsePermissionedSwapPair: vi.fn(),
}))

// Pass-through stub for the info bottom sheet so we can assert open/close transitions
// without portal-based render through Tamagui's full Modal stack.
vi.mock('uniswap/src/features/permissionedTokens/PermissionedTokenInfoBottomSheet', () => ({
  PermissionedTokenInfoBottomSheet: ({ isOpen, tokenSymbol }: { isOpen: boolean; tokenSymbol: string }) =>
    isOpen ? <div data-testid="info-sheet">{tokenSymbol}</div> : null,
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

const ETHEREUM = 1
const TPT2 = '0x7B7C6A29368eEbe78BFab9eAE09d958Da5cAD9a4'

function setupSwapStore(): void {
  mockUseSwapFormStoreDerivedSwapInfo.mockImplementation((selector: (s: unknown) => unknown) =>
    selector({
      currencies: {
        [CurrencyField.INPUT]: { currency: { chainId: ETHEREUM, isNative: false, address: TPT2, symbol: 'TPT2' } },
        [CurrencyField.OUTPUT]: { currency: { chainId: ETHEREUM, isNative: true, symbol: 'ETH' } },
      },
      chainId: ETHEREUM,
    }),
  )
}

describe('SwapFormPermissionedWarningCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupSwapStore()
    mockUseActiveAccount.mockReturnValue({ address: '0xWallet' })
  })

  it('renders the warning card when wallet is connected and not allowlisted on a permissioned token', () => {
    mockUsePermissionedSwapPair.mockReturnValue({
      isPermissioned: true,
      isAllowlisted: false,
      permissionedSymbol: 'TPT2',
    })

    renderWithTheme(<SwapFormPermissionedWarningCard />)

    expect(screen.getByText(/permissionedPool\.banner\.heading:TPT2/)).toBeTruthy()
    expect(screen.getByText('permissionedPool.banner.description')).toBeTruthy()
  })

  it('returns null when the user is allowlisted (happy path)', () => {
    mockUsePermissionedSwapPair.mockReturnValue({
      isPermissioned: true,
      isAllowlisted: true,
      permissionedSymbol: 'TPT2',
    })

    renderWithTheme(<SwapFormPermissionedWarningCard />)

    expect(screen.queryByText(/permissionedPool\.banner\.heading/)).toBeNull()
  })

  it('returns null when neither side of the pair is permissioned', () => {
    mockUsePermissionedSwapPair.mockReturnValue({
      isPermissioned: false,
      isAllowlisted: true,
      permissionedSymbol: undefined,
    })

    renderWithTheme(<SwapFormPermissionedWarningCard />)

    expect(screen.queryByText(/permissionedPool\.banner\.heading/)).toBeNull()
  })

  it('falls back to empty string when permissionedSymbol is undefined but card is shown', () => {
    mockUsePermissionedSwapPair.mockReturnValue({
      isPermissioned: true,
      isAllowlisted: false,
      permissionedSymbol: undefined,
    })

    renderWithTheme(<SwapFormPermissionedWarningCard />)

    expect(screen.getByText(/permissionedPool\.banner\.heading/)).toBeTruthy()
  })

  it('opens the info bottom sheet on card press (web environment)', () => {
    // In the JSDOM test environment `isWebApp` is true by default, so the card is
    // wrapped in a TouchableArea per the web Figma flow. Pressing the heading text
    // should bubble to the wrapper and open the info sheet.
    mockUsePermissionedSwapPair.mockReturnValue({
      isPermissioned: true,
      isAllowlisted: false,
      permissionedSymbol: 'TPT2',
    })

    renderWithTheme(<SwapFormPermissionedWarningCard />)

    expect(screen.queryByTestId('info-sheet')).toBeNull()
    fireEvent.click(screen.getByText('permissionedPool.banner.heading:TPT2'))
    expect(screen.getByTestId('info-sheet')).toBeTruthy()
    expect(screen.getByTestId('info-sheet').textContent).toBe('TPT2')
  })

  it('renders the output-side symbol when the permissioned token is on the buy side', () => {
    // Swap store has the permissioned token on OUTPUT; card should pull the symbol from
    // usePermissionedSwapPair.permissionedSymbol regardless of which side is denied.
    mockUseSwapFormStoreDerivedSwapInfo.mockImplementation((selector: (s: unknown) => unknown) =>
      selector({
        currencies: {
          [CurrencyField.INPUT]: { currency: { chainId: ETHEREUM, isNative: true, symbol: 'ETH' } },
          [CurrencyField.OUTPUT]: {
            currency: { chainId: ETHEREUM, isNative: false, address: '0xSLINK', symbol: 'SLINK' },
          },
        },
        chainId: ETHEREUM,
      }),
    )
    mockUsePermissionedSwapPair.mockReturnValue({
      isPermissioned: true,
      isAllowlisted: false,
      permissionedSymbol: 'SLINK',
    })

    renderWithTheme(<SwapFormPermissionedWarningCard />)

    expect(screen.getByText(/permissionedPool\.banner\.heading:SLINK/)).toBeTruthy()
  })
})
