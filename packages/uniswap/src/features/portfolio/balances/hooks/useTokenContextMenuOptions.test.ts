import { renderHook } from '@testing-library/react'
import { act } from 'react'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import {
  TokenMenuActionType,
  useTokenContextMenuOptions,
} from 'uniswap/src/features/portfolio/balances/hooks/useTokenContextMenuOptions'
import { beforeEach, describe, expect, it, vi } from 'vitest'

let mockHasViewedExplainer = false

vi.mock('react-redux', () => ({
  useDispatch: () => vi.fn(),
  useSelector: () => mockHasViewedExplainer,
}))

vi.mock('uniswap/src/contexts/UniswapContext', () => ({
  useUniswapContext: () => ({
    navigateToSwapFlow: vi.fn(),
    navigateToReceive: vi.fn(),
    navigateToSendFlow: vi.fn(),
    handleShareToken: vi.fn(),
    navigateToTokenDetails: vi.fn(),
  }),
}))

vi.mock('uniswap/src/features/accounts/store/hooks', () => ({
  useActiveAddresses: () => ({ evmAddress: '0x123', svmAddress: undefined }),
}))

vi.mock('uniswap/src/features/chains/hooks/useEnabledChains', () => ({
  useEnabledChains: () => ({
    defaultChainId: UniverseChainId.Mainnet,
    isTestnetModeEnabled: false,
    chains: [UniverseChainId.Mainnet],
  }),
}))

vi.mock('uniswap/src/features/dataApi/balances/balancesRest', () => ({
  usePortfolioCacheUpdater: () => vi.fn(),
}))

vi.mock('uniswap/src/features/visibility/hooks/useTokenVisibility', () => ({
  useTokenVisibility: () => true,
}))

vi.mock('uniswap/src/features/telemetry/send', () => ({
  sendAnalyticsEvent: vi.fn(),
}))

vi.mock('@universe/environment', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@universe/environment')>()
  return {
    ...actual,
    isMobileApp: true,
    isWebPlatform: false,
    isExtensionApp: false,
    isMobileWeb: false,
    isWebApp: false,
    isWebAppDesktop: false,
    isAndroid: false,
    isIOS: false,
    isWebIOS: false,
    isWebAndroid: false,
    isTouchable: false,
    isHoverable: false,
    isChrome: false,
    isSafari: false,
    isMobileWebSafari: false,
    isMobileWebAndroid: false,
  }
})

const ERC20_CURRENCY_ID = `${UniverseChainId.Mainnet}-0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48`

function renderWithDefaults(overrides: Partial<Parameters<typeof useTokenContextMenuOptions>[0]> = {}) {
  return renderHook(() =>
    useTokenContextMenuOptions({
      currencyId: ERC20_CURRENCY_ID,
      isBlocked: false,
      openReportTokenModal: vi.fn(),
      copyAddressToClipboard: vi.fn(),
      closeMenu: vi.fn(),
      ...overrides,
    }),
  )
}

function findCopyAction(actions: ReturnType<typeof useTokenContextMenuOptions>) {
  return actions.find((a) => a.id === TokenMenuActionType.CopyAddress)
}

describe(useTokenContextMenuOptions, () => {
  beforeEach(() => {
    mockHasViewedExplainer = false
  })

  it('should include CopyAddress action for non-native ERC-20 tokens', () => {
    const { result } = renderWithDefaults()
    expect(findCopyAction(result.current)).toBeDefined()
  })

  it('should call onPressCopyAddressOverride when override is provided and explainer already viewed', async () => {
    mockHasViewedExplainer = true
    const copyAddressToClipboard = vi.fn()
    const onPressCopyAddressOverride = vi.fn()

    const { result } = renderWithDefaults({ copyAddressToClipboard, onPressCopyAddressOverride })
    const copyAction = findCopyAction(result.current)

    await act(async () => {
      copyAction?.onPress()
    })

    expect(onPressCopyAddressOverride).toHaveBeenCalledTimes(1)
    expect(copyAddressToClipboard).not.toHaveBeenCalled()
  })

  it('should call copyAddressToClipboard when no override is provided and explainer already viewed', async () => {
    mockHasViewedExplainer = true
    const copyAddressToClipboard = vi.fn()

    const { result } = renderWithDefaults({ copyAddressToClipboard })
    const copyAction = findCopyAction(result.current)

    await act(async () => {
      copyAction?.onPress()
    })

    expect(copyAddressToClipboard).toHaveBeenCalledTimes(1)
  })

  it('should not include CopyAddress action when copyAddressToClipboard is not provided', () => {
    const { result } = renderWithDefaults({ copyAddressToClipboard: undefined })
    expect(findCopyAction(result.current)).toBeUndefined()
  })

  it('should open explainer before override for first-time users on mobile', async () => {
    mockHasViewedExplainer = false
    const openContractAddressExplainerModal = vi.fn()
    const onPressCopyAddressOverride = vi.fn()
    const copyAddressToClipboard = vi.fn()

    const { result } = renderWithDefaults({
      copyAddressToClipboard,
      onPressCopyAddressOverride,
      openContractAddressExplainerModal,
    })
    const copyAction = findCopyAction(result.current)

    await act(async () => {
      copyAction?.onPress()
    })

    expect(openContractAddressExplainerModal).toHaveBeenCalledTimes(1)
    expect(onPressCopyAddressOverride).not.toHaveBeenCalled()
    expect(copyAddressToClipboard).not.toHaveBeenCalled()
  })

  it('should skip explainer and call override for returning users', async () => {
    mockHasViewedExplainer = true
    const openContractAddressExplainerModal = vi.fn()
    const onPressCopyAddressOverride = vi.fn()
    const copyAddressToClipboard = vi.fn()

    const { result } = renderWithDefaults({
      copyAddressToClipboard,
      onPressCopyAddressOverride,
      openContractAddressExplainerModal,
    })
    const copyAction = findCopyAction(result.current)

    await act(async () => {
      copyAction?.onPress()
    })

    expect(openContractAddressExplainerModal).not.toHaveBeenCalled()
    expect(onPressCopyAddressOverride).toHaveBeenCalledTimes(1)
    expect(copyAddressToClipboard).not.toHaveBeenCalled()
  })
})
