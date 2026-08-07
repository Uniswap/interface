import { render } from '@testing-library/react-native'
import React from 'react'

// All vi.mock calls must precede importing the SUT.

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      if (options && typeof options === 'object' && 'tokenSymbol' in options) {
        return `${key}::${String(options['tokenSymbol'])}`
      }
      return key
    },
  }),
}))

const mockDispatch = vi.fn()
vi.mock('react-redux', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-redux')>()),
  useDispatch: () => mockDispatch,
  useSelector: vi.fn().mockReturnValue(undefined),
}))

// Multichain TDP is rolled out to ~99% of users and the flag is being retired,
// so we exercise the multichain code path as the production behavior.
vi.mock('@universe/gating', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/gating')>()),
  useFeatureFlag: vi.fn().mockReturnValue(true),
}))

vi.mock('src/app/navigation/rootNavigation', () => ({
  navigate: vi.fn(),
}))

vi.mock('src/components/TokenDetails/TokenDetailsContext', () => ({
  useTokenDetailsContext: vi.fn(),
}))

// Capture the props passed into useTokenDetailsCTAVariant / useMultichainBuyVariant so
// we can grab the onPressSwap / onPressBuy handlers the wrapper constructs and invoke
// them directly. This is the cleanest way to assert wrapper handler behavior without
// having to render every downstream button component.
const mockUseTokenDetailsCTAVariant = vi.fn()
const mockUseMultichainBuyVariant = vi.fn()
vi.mock('src/components/TokenDetails/useTokenDetailsCTAVariant', () => ({
  useTokenDetailsCTAVariant: (...args: unknown[]) => {
    mockUseTokenDetailsCTAVariant(...args)
    return {}
  },
  useMultichainBuyVariant: (...args: unknown[]) => {
    mockUseMultichainBuyVariant(...args)
    return { icon: undefined, title: 'Buy', onPress: vi.fn() }
  },
}))

vi.mock('src/components/TokenDetails/useTokenDetailsCurrentChainBalance', () => ({
  useTokenDetailsCurrentChainBalance: vi.fn().mockReturnValue({ balanceUSD: 100 }),
}))

vi.mock('src/screens/TokenDetailsScreen/useHighestTvlChain', () => ({
  useHighestTvlChain: vi.fn().mockReturnValue({ chainId: undefined, address: undefined }),
}))

const mockOpenSendSheet = vi.fn()
vi.mock('src/screens/TokenDetailsScreen/useNetworkBalanceSheet', () => ({
  // `() => ({...})` rather than `vi.fn().mockReturnValue({...})` so closure refs to
  // `mock*` vars (and module constants like TPT2/ETHEREUM) resolve when the hook is
  // called, not when the hoisted factory runs.
  useNetworkBalanceSheet: () => ({
    // Multichain mode keys `hasTokenBalance` off `allChainBalances.length`. Seed a
    // single entry on the same chain as the TDP so the overflow menu surfaces Send
    // and `onPressBuy`'s highest-balance branch resolves back to the current chain,
    // keeping the navigation assertions chain-stable.
    allChainBalances: [
      {
        currencyInfo: {
          currency: { isToken: true, address: TPT2, chainId: ETHEREUM, symbol: 'TPT2' },
        },
        balanceUSD: 100,
      },
    ],
    hasMultiChainBalances: false,
    isNetworkSheetOpen: false,
    openSellSheet: vi.fn(),
    openSendSheet: mockOpenSendSheet,
    onCloseNetworkSheet: vi.fn(),
    onSelectNetwork: vi.fn(),
  }),
}))

vi.mock('src/utils/useIsScreenNavigationReady', () => ({
  useIsScreenNavigationReady: vi.fn().mockReturnValue(true),
}))

// Capture the props passed into TokenDetailsBuySellButtons / TokenDetailsSwapButtons so
// we can find the "send" action menu entry and invoke its onPress to drive onPressSend.
const mockBuySellButtonsProps = vi.fn()
const mockSwapButtonsProps = vi.fn()
vi.mock('src/components/TokenDetails/TokenDetailsActionButtons', () => ({
  TokenDetailsBuySellButtons: (props: Record<string, unknown>) => {
    mockBuySellButtonsProps(props)
    return null
  },
  TokenDetailsSwapButtons: (props: Record<string, unknown>) => {
    mockSwapButtonsProps(props)
    return null
  },
}))

vi.mock('uniswap/src/data/graphql/fragments', () => ({
  useTokenBasicInfoPartsFragment: vi
    .fn()
    .mockReturnValue({ data: { symbol: 'TPT2', name: 'Test Permissioned Token' } }),
}))

// The wrapper reads token metadata through a tanstack useQuery internally, which would
// require a QueryClientProvider in the render tree. Mock at the hook boundary instead;
// the wrapper only consumes `metadata.symbol` (for the RWA sell-toast copy).
vi.mock('uniswap/src/features/dataApi/tokenDetails/useTokenDetailsData', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/features/dataApi/tokenDetails/useTokenDetailsData')>()),
  useTokenMetadata: vi.fn().mockReturnValue({ symbol: 'TPT2' }),
}))

vi.mock('uniswap/src/features/bridging/hooks/tokens', () => ({
  useBridgingTokenWithHighestBalance: vi.fn().mockReturnValue({ data: undefined, isLoading: false }),
}))

vi.mock('uniswap/src/features/chains/hooks/useEnabledChains', () => ({
  useEnabledChains: vi.fn().mockReturnValue({ isTestnetModeEnabled: false }),
}))

// The wrapper gates RWA trading via useGatedTokenDetailsRWAMatch (whitelist match) +
// useIsFeatureGated(ISSUER_SPECIFIC_RWA) (region signal, from compliance v2). That path needs a
// ComplianceClientProvider. These permissioned-gating tests don't exercise RWA geo-blocking,
// so mock both hooks at the boundary to keep the RWA machinery out of the test.
vi.mock('src/components/TokenDetails/useTokenDetailsRWAMatch', () => ({
  useGatedTokenDetailsRWAMatch: vi.fn().mockReturnValue(undefined),
}))

vi.mock('@universe/compliance', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/compliance')>()),
  useIsFeatureGated: vi.fn().mockReturnValue(false),
}))

vi.mock('uniswap/src/features/fiatOnRamp/hooks', () => ({
  useIsSupportedFiatOnRampCurrency: vi.fn().mockReturnValue({ currency: undefined, isLoading: false }),
}))

vi.mock('uniswap/src/features/gas/hooks/useChainGasToken', () => ({
  useChainGasToken: vi.fn().mockReturnValue({ gasBalance: undefined, isLoading: false }),
}))

vi.mock('uniswap/src/hooks/useAppInsets', () => ({
  useAppInsets: vi.fn().mockReturnValue({ top: 0, bottom: 0, left: 0, right: 0 }),
}))

const mockNavigateToSwapFlow = vi.fn()
const mockNavigateToSend = vi.fn()
const mockNavigateToReceive = vi.fn()
const mockNavigateToFiatOnRamp = vi.fn()
vi.mock('wallet/src/contexts/WalletNavigationContext', () => ({
  // `() => ({...})` rather than `vi.fn().mockReturnValue({...})` so closure refs to
  // `mock*` vars resolve when the hook is called, not when the hoisted factory runs.
  useWalletNavigation: () => ({
    navigateToFiatOnRamp: mockNavigateToFiatOnRamp,
    navigateToSwapFlow: mockNavigateToSwapFlow,
    navigateToSend: mockNavigateToSend,
    navigateToReceive: mockNavigateToReceive,
  }),
}))

vi.mock('wallet/src/features/wallet/hooks', () => ({
  useActiveAccountAddressWithThrow: vi.fn().mockReturnValue('0xWallet'),
}))

vi.mock('src/screens/TokenDetailsScreen/NetworkBalanceSheetContent', () => ({
  NetworkBalanceSheetContent: () => null,
}))

vi.mock('uniswap/src/components/modals/Modal', () => ({
  Modal: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('ui/src/components/layout/AnimatedFlex', () => ({
  AnimatedFlex: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}))

// Real imports after the mocks register.
import { useTokenDetailsContext } from 'src/components/TokenDetails/TokenDetailsContext'
import { TokenDetailsActionButtonsWrapper } from 'src/screens/TokenDetailsScreen/TokenDetailsActionButtonsWrapper'
import { CurrencyField } from 'uniswap/src/types/currency'

const mockUseTokenDetailsContext = vi.mocked(useTokenDetailsContext)

const TPT2 = '0x7B7C6A29368eEbe78BFab9eAE09d958Da5cAD9a4'
const ETHEREUM = 1

function setupContext(overrides: Record<string, unknown> = {}): void {
  mockUseTokenDetailsContext.mockReturnValue({
    currencyId: `${ETHEREUM}-${TPT2}`,
    chainId: ETHEREUM,
    address: TPT2,
    currencyInfo: {
      currency: { chainId: ETHEREUM, address: TPT2, symbol: 'TPT2' },
      safetyInfo: undefined,
    },
    openTokenWarningModal: vi.fn(),
    tokenColorLoading: false,
    navigation: { isFocused: () => true } as never,
    isPermissioned: false,
    isAllowlisted: true,
    kycUrl: undefined,
    issuer: undefined,
    ...overrides,
  } as never)
}

interface MenuOption {
  label: string
  onPress: () => void
}

function getSendActionFromMenu(): MenuOption | undefined {
  const buySellCalls = mockBuySellButtonsProps.mock.calls
  const swapCalls = mockSwapButtonsProps.mock.calls
  // Exactly one variant should be mounted per render. Fail loudly so a future change
  // that mounts both (or neither) doesn't silently slip past a stale test fixture.
  if (buySellCalls.length === 0 && swapCalls.length === 0) {
    throw new Error('No Buy/Sell or Swap buttons rendered. Wrapper did not mount either variant.')
  }
  if (buySellCalls.length > 0 && swapCalls.length > 0) {
    throw new Error('Both Buy/Sell and Swap buttons rendered. Wrapper should only mount one variant per state.')
  }
  const props = buySellCalls[0]?.[0] ?? swapCalls[0]?.[0]
  const menu = (props?.actionMenuOptions ?? []) as MenuOption[]
  return menu.find((opt) => opt.label === 'common.button.send')
}

describe('TokenDetailsActionButtonsWrapper — permissioned-token gating', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('onPressSend (TDP overflow menu)', () => {
    it('navigates to the Send screen even when the token is permissioned', () => {
      // The wrapper does not short-circuit on permissioned tokens. The recipient-
      // allowlist check lives inside SendFormButton; the wrapper just gets the user
      // into the flow.
      setupContext({ isPermissioned: true })

      render(<TokenDetailsActionButtonsWrapper />)
      const sendAction = getSendActionFromMenu()
      expect(sendAction).toBeDefined()

      sendAction?.onPress()

      expect(mockNavigateToSend).toHaveBeenCalledWith({ currencyAddress: TPT2, chainId: ETHEREUM })
      // `hasMultiChainBalances: false` pins us to the direct-nav branch in multichain mode.
      expect(mockOpenSendSheet).not.toHaveBeenCalled()
      expect(mockDispatch).not.toHaveBeenCalled()
    })

    it('navigates to the Send screen normally when the token is not permissioned', () => {
      setupContext({ isPermissioned: false })

      render(<TokenDetailsActionButtonsWrapper />)
      const sendAction = getSendActionFromMenu()
      expect(sendAction).toBeDefined()

      sendAction?.onPress()

      expect(mockNavigateToSend).toHaveBeenCalledWith({ currencyAddress: TPT2, chainId: ETHEREUM })
      expect(mockOpenSendSheet).not.toHaveBeenCalled()
      // No toast should fire for a regular Send.
      expect(mockDispatch).not.toHaveBeenCalled()
    })

    it('still navigates to the Send screen when the token is permissioned and the wallet is denied', () => {
      // Matches the onPressSwap / onPressBuy denied-case assertions: the wrapper does not
      // short-circuit on permissioned+denied; SendFormButton surfaces the verify-identity gate.
      setupContext({ isPermissioned: true, isAllowlisted: false })

      render(<TokenDetailsActionButtonsWrapper />)
      const sendAction = getSendActionFromMenu()
      expect(sendAction).toBeDefined()

      sendAction?.onPress()

      expect(mockNavigateToSend).toHaveBeenCalledWith({ currencyAddress: TPT2, chainId: ETHEREUM })
      expect(mockOpenSendSheet).not.toHaveBeenCalled()
      expect(mockDispatch).not.toHaveBeenCalled()
    })
  })

  describe('onPressSwap (TDP swap CTA)', () => {
    it('does NOT short-circuit on permissioned tokens — falls through to navigateToSwapFlow', () => {
      // Per Figma, permissioned tokens still let the user *into* the swap flow; the
      // SwapFormButton inside swap then surfaces the "Verify identity" CTA. The wrapper
      // must NOT pop the VerifyIdentityBottomSheet here.
      //
      // In the multichain wrapper, the Sell CTA drives the input-side swap: TokenDetailsBuySellButtons
      // receives onPressSell, which (with hasMultiChainBalances: false) calls onPressSwap(INPUT).
      setupContext({ isPermissioned: true, isAllowlisted: false })

      render(<TokenDetailsActionButtonsWrapper />)

      const buySellProps = mockBuySellButtonsProps.mock.calls[0]?.[0] as { onPressSell: () => void } | undefined
      expect(buySellProps?.onPressSell).toBeDefined()
      buySellProps?.onPressSell()

      expect(mockNavigateToSwapFlow).toHaveBeenCalledWith({
        currencyField: CurrencyField.INPUT,
        currencyAddress: TPT2,
        currencyChainId: ETHEREUM,
      })
    })
  })

  describe('onPressBuy (TDP buy CTA)', () => {
    it('does NOT short-circuit on permissioned tokens — falls through to navigateToSwapFlow', () => {
      // Same rule as onPressSwap: permissioned + denied still routes into swap, where the
      // SwapFormButton handles the verify-identity surfacing.
      setupContext({ isPermissioned: true, isAllowlisted: false })

      render(<TokenDetailsActionButtonsWrapper />)

      const buyArgs = mockUseMultichainBuyVariant.mock.calls[0]?.[0] as { onPressBuy: () => void } | undefined
      expect(buyArgs?.onPressBuy).toBeDefined()
      buyArgs?.onPressBuy()

      expect(mockNavigateToSwapFlow).toHaveBeenCalledWith({
        currencyField: CurrencyField.OUTPUT,
        currencyAddress: TPT2,
        currencyChainId: ETHEREUM,
      })
    })
  })
})
