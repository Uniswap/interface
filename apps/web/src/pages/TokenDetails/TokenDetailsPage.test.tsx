import { render, screen, waitFor } from '@testing-library/react'
import type { Currency } from '@uniswap/sdk-core'
import { UniverseChainId } from '@universe/chains'
import type { PropsWithChildren } from 'react'
import type { MultichainTokenEntry } from 'uniswap/src/components/MultichainTokenDetails/useOrderedMultichainEntries'
import { getNativeAddress } from 'uniswap/src/constants/addresses'
import { buildCurrency } from 'uniswap/src/features/dataApi/utils/buildCurrency'
import { TokenDetailsPage } from '~/pages/TokenDetails/TokenDetailsPage'

const { mockNavigate, mockMultichainEntries, storeState } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockMultichainEntries: { current: [] as MultichainTokenEntry[] },
  storeState: {
    address: '0x1234',
    currency: undefined as Currency | undefined,
    currencyChainId: 1 as UniverseChainId,
    token: undefined,
    pageQueryLoading: true,
    multiChainMap: {},
    selectedMultichainChainId: undefined as UniverseChainId | undefined,
  },
}))

vi.mock('@universe/gating', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/gating')>()),
  useStatsigClientStatus: () => ({ isStatsigReady: true }),
}))
vi.mock('react-helmet-async/lib/index', () => ({
  Helmet: ({ children }: PropsWithChildren) => children,
}))
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))
vi.mock('react-router', () => ({ useNavigate: () => mockNavigate }))
vi.mock('uniswap/src/features/chains/hooks/useFeatureFlaggedChainIds', () => ({
  useFeatureFlaggedChainIds: () => [1],
}))
vi.mock('uniswap/src/features/language/LocalizationContext', () => ({
  useLocalizationContext: () => ({ convertFiatAmountFormatted: vi.fn() }),
}))
vi.mock('uniswap/src/features/telemetry/constants', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/features/telemetry/constants')>()),
  ModalName: { NotFound: 'not-found' },
}))
vi.mock('utilities/src/format/types', () => ({
  NumberType: { FiatTokenPrice: 'fiat-token-price' },
}))
vi.mock('~/hooks/useScrollCompact', () => ({ useScrollCompact: () => false }))
vi.mock('~/pages/metatags', () => ({ useDynamicMetatags: () => [] }))
vi.mock('~/pages/TokenDetails/components/skeleton/Skeleton', () => ({
  TokenDetailsPageSkeleton: () => <div data-testid="token-details-page-skeleton" />,
}))
vi.mock('~/pages/TokenDetails/components/TokenDetails', () => ({
  TokenDetailsContent: () => null,
}))
vi.mock('~/pages/TokenDetails/context/TDPStoreContextProvider', () => ({
  TDPStoreContextProvider: ({ children }: PropsWithChildren) => children,
}))
vi.mock('~/pages/TokenDetails/context/useTDPStore', () => ({
  useTDPStore: (selector: (state: typeof storeState) => unknown) => selector(storeState),
}))
vi.mock('~/pages/TokenDetails/hooks/useMultichainTokenEntries', () => ({
  useMultichainTokenEntries: () => mockMultichainEntries.current,
}))
vi.mock('~/pages/TokenDetails/pageMetadata', async (importOriginal) => ({
  ...(await importOriginal<typeof import('~/pages/TokenDetails/pageMetadata')>()),
  getTokenPageDescription: () => '',
  getTokenStructuredData: () => undefined,
}))
vi.mock('~/shared-cloud/metatags', () => ({
  formatTokenMetatagTitleName: () => '',
}))
vi.mock('~/types/explore', () => ({ ExploreTab: { Tokens: 'tokens' } }))
vi.mock('~/utils/nativeTokens', () => ({ getNativeTokenDBAddress: () => '' }))

describe('TokenDetailsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    storeState.pageQueryLoading = true
    storeState.currency = undefined
    storeState.currencyChainId = UniverseChainId.Mainnet
    storeState.selectedMultichainChainId = undefined
    mockMultichainEntries.current = []
  })

  it('navigates to the existing not-found URL after the canonical lookup settles without a currency', async () => {
    storeState.pageQueryLoading = false

    render(<TokenDetailsPage />)

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/explore?type=tokens&result=not-found', { replace: true })
    })
  })

  it('renders the page skeleton while loading', () => {
    render(<TokenDetailsPage />)

    expect(screen.getByTestId('token-details-page-skeleton')).toBeInTheDocument()
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  describe('page title', () => {
    const USDC_MAINNET = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
    const USDC_BASE = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'

    const nativeEntry = (chainId: UniverseChainId): MultichainTokenEntry => ({
      chainId,
      address: getNativeAddress(chainId),
      isNative: true,
    })

    function renderLoadedPage({
      currency,
      entries,
      selectedChainId,
    }: {
      currency: Currency | undefined
      entries: MultichainTokenEntry[]
      selectedChainId: UniverseChainId | undefined
    }): void {
      storeState.pageQueryLoading = false
      storeState.currency = currency
      storeState.currencyChainId = currency?.chainId ?? UniverseChainId.Mainnet
      storeState.selectedMultichainChainId = selectedChainId
      mockMultichainEntries.current = entries
      render(<TokenDetailsPage />)
    }

    // Expected titles are written out literally rather than derived from chain info, so a regression in
    // how the title picks its currency or chain cannot be masked by the same derivation in the test.
    const robinhoodEth = (): Currency | undefined =>
      buildCurrency({ chainId: UniverseChainId.Robinhood, decimals: 18, symbol: 'ETH', name: 'Robinhood ETH' })

    it('uses the chain from the URL when no network is selected', () => {
      renderLoadedPage({ currency: robinhoodEth(), entries: [], selectedChainId: undefined })

      expect(document.title).toBe('Robinhood ETH (ETH) on Robinhood Chain: common.buyAndSell')
    })

    it('follows the selected network after switching networks on a multichain native token', () => {
      renderLoadedPage({
        currency: robinhoodEth(),
        entries: [nativeEntry(UniverseChainId.Robinhood), nativeEntry(UniverseChainId.Base)],
        selectedChainId: UniverseChainId.Base,
      })

      expect(document.title).toBe('Base ETH (ETH) on Base: common.buyAndSell')
    })

    it('drops the chain suffix when switching a multichain ERC20 to Ethereum mainnet', () => {
      renderLoadedPage({
        currency: buildCurrency({
          chainId: UniverseChainId.Base,
          address: USDC_BASE,
          decimals: 6,
          symbol: 'USDC',
          name: 'USD Coin',
        }),
        entries: [
          { chainId: UniverseChainId.Base, address: USDC_BASE, isNative: false },
          { chainId: UniverseChainId.Mainnet, address: USDC_MAINNET, isNative: false },
        ],
        selectedChainId: UniverseChainId.Mainnet,
      })

      expect(document.title).toBe('USD Coin (USDC): common.buyAndSell')
    })

    it('keeps the URL chain when the selected network is not one of the deployments', () => {
      renderLoadedPage({
        currency: robinhoodEth(),
        entries: [nativeEntry(UniverseChainId.Robinhood), nativeEntry(UniverseChainId.Base)],
        selectedChainId: UniverseChainId.Unichain,
      })

      expect(document.title).toBe('Robinhood ETH (ETH) on Robinhood Chain: common.buyAndSell')
    })

    it('ignores a selection on a single-deployment token', () => {
      renderLoadedPage({
        currency: robinhoodEth(),
        entries: [nativeEntry(UniverseChainId.Robinhood)],
        selectedChainId: UniverseChainId.Robinhood,
      })

      expect(document.title).toBe('Robinhood ETH (ETH) on Robinhood Chain: common.buyAndSell')
    })

    it('falls back to the base title while the token is still loading', () => {
      storeState.selectedMultichainChainId = UniverseChainId.Base
      mockMultichainEntries.current = [nativeEntry(UniverseChainId.Robinhood), nativeEntry(UniverseChainId.Base)]

      render(<TokenDetailsPage />)

      expect(document.title).toBe('common.buyAndSell')
    })
  })
})
