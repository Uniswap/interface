import { Currency, Token } from '@uniswap/sdk-core'
import {
  TokenContextMenuAction,
  UseSearchTokenMenuItemsParams,
  useSearchTokenMenuItems,
} from 'uniswap/src/components/lists/items/tokens/useSearchTokenMenuItems'
import { useUniswapContext } from 'uniswap/src/contexts/UniswapContext'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { renderHook } from 'uniswap/src/test/test-utils'
import type { Mock } from 'vitest'

vi.mock('uniswap/src/contexts/UniswapContext', async (importOriginal) => ({
  ...(await importOriginal()),
  useUniswapContext: vi.fn(),
}))

vi.mock('uniswap/src/features/accounts/store/hooks', () => ({
  useActiveAddress: vi.fn(() => '0xTestAddress'),
}))

vi.mock('uniswap/src/features/chains/hooks/useEnabledChains', () => ({
  useEnabledChains: vi.fn(() => ({ isTestnetModeEnabled: false })),
}))

vi.mock('uniswap/src/features/favorites/hooks/useSelectHasTokenFavorited', () => ({
  useSelectHasTokenFavorited: vi.fn(() => false),
}))

vi.mock('uniswap/src/features/favorites/hooks/useToggleFavoriteCallback', () => ({
  useToggleFavoriteCallback: vi.fn(() => vi.fn()),
}))

vi.mock('utilities/src/clipboard/clipboard', () => ({
  setClipboard: vi.fn(),
}))

vi.mock('uniswap/src/features/telemetry/send', () => ({
  sendAnalyticsEvent: vi.fn(),
}))

const mockNavigateToTokenDetails = vi.fn()
const mockNavigateToSwapFlow = vi.fn()
const mockNavigateToSendFlow = vi.fn()
const mockNavigateToReceive = vi.fn()
const mockHandleShareToken = vi.fn()

;(useUniswapContext as Mock).mockReturnValue({
  navigateToTokenDetails: mockNavigateToTokenDetails,
  navigateToSwapFlow: mockNavigateToSwapFlow,
  navigateToSendFlow: mockNavigateToSendFlow,
  navigateToReceive: mockNavigateToReceive,
  handleShareToken: mockHandleShareToken,
})

const USDC_TOKEN = new Token(
  UniverseChainId.Mainnet,
  '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  6,
  'USDC',
  'USD Coin',
)

const ALL_ACTIONS: TokenContextMenuAction[] = [
  TokenContextMenuAction.CopyAddress,
  TokenContextMenuAction.Favorite,
  TokenContextMenuAction.Swap,
  TokenContextMenuAction.Send,
  TokenContextMenuAction.Receive,
  TokenContextMenuAction.Share,
  TokenContextMenuAction.ViewDetails,
]

function renderUseSearchTokenMenuItems(overrides: Partial<UseSearchTokenMenuItemsParams> = {}) {
  const defaultParams: UseSearchTokenMenuItemsParams = {
    currency: USDC_TOKEN as Currency,
    closeMenu: vi.fn(),
    actions: ALL_ACTIONS,
    ...overrides,
  }
  return renderHook(() => useSearchTokenMenuItems(defaultParams))
}

describe(useSearchTokenMenuItems, () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(useUniswapContext as Mock).mockReturnValue({
      navigateToTokenDetails: mockNavigateToTokenDetails,
      navigateToSwapFlow: mockNavigateToSwapFlow,
      navigateToSendFlow: mockNavigateToSendFlow,
      navigateToReceive: mockNavigateToReceive,
      handleShareToken: mockHandleShareToken,
    })
  })

  it('returns a menu item for each requested action', () => {
    const { result } = renderUseSearchTokenMenuItems()
    // CopyAddress, Favorite, Swap, Send, Receive, Share, ViewDetails = 7
    expect(result.current.menuItems).toHaveLength(7)
  })

  it('returns only requested actions', () => {
    const { result } = renderUseSearchTokenMenuItems({
      actions: [TokenContextMenuAction.Swap, TokenContextMenuAction.Share],
    })

    expect(result.current.menuItems).toHaveLength(2)
    expect(result.current.menuItems[0]!.label).toMatch(/swap/i)
    expect(result.current.menuItems[1]!.label).toMatch(/share/i)
  })

  it('includes Copy Address item with correct label', () => {
    const { result } = renderUseSearchTokenMenuItems({
      actions: [TokenContextMenuAction.CopyAddress],
    })

    expect(result.current.menuItems).toHaveLength(1)
    expect(result.current.menuItems[0]!.label).toMatch(/copy.*address/i)
  })

  it('disables Copy Address for native tokens', () => {
    const nativeCurrency = {
      ...USDC_TOKEN,
      isNative: true,
    } as unknown as Currency

    const { result } = renderUseSearchTokenMenuItems({
      currency: nativeCurrency,
      actions: [TokenContextMenuAction.CopyAddress],
    })

    expect(result.current.menuItems[0]!.disabled).toBe(true)
  })

  it('uses copyAddressOverride when provided', () => {
    const overrideOnPress = vi.fn()
    const { result } = renderUseSearchTokenMenuItems({
      actions: [TokenContextMenuAction.CopyAddress],
      copyAddressOverride: {
        onPress: overrideOnPress,
        disabled: true,
      },
    })

    const copyItem = result.current.menuItems[0]!
    expect(copyItem.disabled).toBe(true)
    expect(copyItem.onPress).toBe(overrideOnPress)
  })

  it('excludes Send for Solana tokens', () => {
    // Use a mock currency object instead of Token class to avoid Solana address validation
    const solanaCurrency = {
      chainId: UniverseChainId.Solana,
      address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      decimals: 6,
      symbol: 'USDC',
      name: 'USD Coin',
      isNative: false,
      isToken: true,
      equals: vi.fn(() => false),
      sortsBefore: vi.fn(() => false),
      wrapped: {} as Token,
    } as unknown as Currency

    const { result } = renderUseSearchTokenMenuItems({
      currency: solanaCurrency,
      actions: [TokenContextMenuAction.Send, TokenContextMenuAction.Swap],
    })

    // Only Swap should be present, Send excluded for Solana
    expect(result.current.menuItems).toHaveLength(1)
    expect(result.current.menuItems[0]!.label).toMatch(/swap/i)
  })

  it('calls closeMenu and navigateToSwapFlow on Swap press', () => {
    const closeMenu = vi.fn()
    const { result } = renderUseSearchTokenMenuItems({
      closeMenu,
      actions: [TokenContextMenuAction.Swap],
    })

    result.current.menuItems[0]!.onPress()

    expect(closeMenu).toHaveBeenCalled()
    expect(mockNavigateToSwapFlow).toHaveBeenCalled()
  })

  it('calls closeMenu and navigateToSendFlow on Send press', () => {
    const closeMenu = vi.fn()
    const { result } = renderUseSearchTokenMenuItems({
      closeMenu,
      actions: [TokenContextMenuAction.Send],
    })

    result.current.menuItems[0]!.onPress()

    expect(closeMenu).toHaveBeenCalled()
    expect(mockNavigateToSendFlow).toHaveBeenCalled()
  })

  it('calls closeMenu and navigateToReceive on Receive press', () => {
    const closeMenu = vi.fn()
    const { result } = renderUseSearchTokenMenuItems({
      closeMenu,
      actions: [TokenContextMenuAction.Receive],
    })

    result.current.menuItems[0]!.onPress()

    expect(closeMenu).toHaveBeenCalled()
    expect(mockNavigateToReceive).toHaveBeenCalled()
  })

  it('calls closeMenu and navigateToTokenDetails on ViewDetails press', () => {
    const closeMenu = vi.fn()
    const { result } = renderUseSearchTokenMenuItems({
      closeMenu,
      actions: [TokenContextMenuAction.ViewDetails],
    })

    result.current.menuItems[0]!.onPress()

    expect(closeMenu).toHaveBeenCalled()
    expect(mockNavigateToTokenDetails).toHaveBeenCalled()
  })
})
