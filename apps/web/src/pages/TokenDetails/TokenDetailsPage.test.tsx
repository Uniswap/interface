import { render, screen, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { TokenDetailsPage } from '~/pages/TokenDetails/TokenDetailsPage'

const { mockNavigate, storeState } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  storeState: {
    address: '0x1234',
    currency: undefined,
    currencyChain: 'ethereum',
    currencyChainId: 1,
    token: undefined,
    pageQueryLoading: true,
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
vi.mock('uniswap/src/features/telemetry/constants', () => ({
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
vi.mock('~/pages/TokenDetails/pageMetadata', () => ({
  getTokenPageDescription: () => '',
  getTokenPageTitle: () => '',
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
})
