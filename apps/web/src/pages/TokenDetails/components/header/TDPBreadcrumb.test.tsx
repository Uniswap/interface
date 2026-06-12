import { RwaCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import type { RWAAsset, RWAToken } from 'uniswap/src/features/rwa/types'
import { TDPBreadcrumb } from '~/pages/TokenDetails/components/header/TDPBreadcrumb'
import type { TDPState } from '~/pages/TokenDetails/context/createTDPStore'
import { useTDPStore } from '~/pages/TokenDetails/context/useTDPStore'
import { useTDPRWAMatch } from '~/pages/TokenDetails/hooks/useTDPRWAMatch'
import { TokenFromList } from '~/state/lists/tokenFromList'
import { mocked } from '~/test-utils/mocked'
import { render, screen } from '~/test-utils/render'

vi.mock('@universe/gating', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@universe/gating')>()
  return {
    ...actual,
    useFeatureFlag: vi.fn(),
  }
})

vi.mock('~/pages/TokenDetails/context/useTDPStore', () => ({
  useTDPStore: vi.fn(),
}))

vi.mock('~/pages/TokenDetails/hooks/useTDPRWAMatch', () => ({
  useTDPRWAMatch: vi.fn(),
}))

const defaultLocation = {
  pathname: '/explore/tokens/ethereum/0x0000000000000000000000000000000000000001',
  search: '',
  hash: '',
  key: 'default',
  state: undefined as { from?: string } | undefined,
}

const mockUseLocation = vi.fn(() => defaultLocation)

vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router')>()
  return {
    ...actual,
    useLocation: () => mockUseLocation(),
  }
})

const WBTC = new TokenFromList({
  chainId: 1,
  address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
  name: 'Wrapped BTC',
  decimals: 18,
  symbol: 'WBTC',
})

const TSLA = new TokenFromList({
  chainId: 1,
  address: '0x0000000000000000000000000000000000000001',
  name: 'Tesla',
  decimals: 18,
  symbol: 'TSLA',
})

const TSLA_TOKEN: RWAToken = {
  chainId: 1,
  address: TSLA.address,
  issuer: 'ondo',
  name: 'Tesla',
  symbol: 'TSLA.on',
  logoUrl: 'https://example.com/tsla-ondo.png',
}

const TSLA_ASSET: RWAAsset = {
  symbol: 'TSLA',
  name: 'Tesla',
  icon: 'https://example.com/tesla.png',
  tokens: [TSLA_TOKEN],
  category: RwaCategory.STOCKS,
}

function mockTDPStore(currency: TokenFromList): void {
  const mockState = { currency } as unknown as TDPState
  mocked(useTDPStore).mockImplementation(((selector: (s: TDPState) => unknown) =>
    selector(mockState)) as typeof useTDPStore)
}

describe('TDPBreadcrumb', () => {
  beforeEach(() => {
    mockUseLocation.mockReturnValue({ ...defaultLocation, state: undefined })
    mocked(useFeatureFlag).mockImplementation((flag) => flag === FeatureFlags.RWAUXExplore)
    mocked(useTDPRWAMatch).mockReturnValue(undefined)
  })

  it('renders Tokens and current symbol for non-RWA tokens', () => {
    mockTDPStore(WBTC)
    render(<TDPBreadcrumb />)

    expect(screen.getByRole('link', { name: /Tokens/i })).toHaveAttribute('href', '/explore/tokens')
    expect(screen.queryByRole('link', { name: /Stocks/i })).not.toBeInTheDocument()
    expect(screen.getByText('WBTC')).toBeInTheDocument()
  })

  it('uses location state from for non-RWA tokens when provided', () => {
    mockTDPStore(WBTC)
    mockUseLocation.mockReturnValue({ ...defaultLocation, state: { from: '/explore/tokens/ethereum' } })
    render(<TDPBreadcrumb />)

    expect(screen.getByRole('link', { name: /Tokens/i })).toHaveAttribute('href', '/explore/tokens/ethereum')
  })

  it('renders Tokens, Stocks, and current symbol for RWA tokens when explore table flag is on', () => {
    mockTDPStore(TSLA)
    mocked(useTDPRWAMatch).mockReturnValue({
      asset: TSLA_ASSET,
      token: TSLA_TOKEN,
    })
    render(<TDPBreadcrumb />)

    expect(screen.getByRole('link', { name: /Tokens/i })).toHaveAttribute('href', '/explore/tokens')
    expect(screen.getByRole('link', { name: /Stocks/i })).toHaveAttribute('href', '/explore/tokens?category=stocks')
    expect(screen.getByText('TSLA')).toBeInTheDocument()
  })

  it('hides Stocks breadcrumb for RWA tokens when explore table flag is off', () => {
    mockTDPStore(TSLA)
    mocked(useFeatureFlag).mockReturnValue(false)
    mocked(useTDPRWAMatch).mockReturnValue({
      asset: TSLA_ASSET,
      token: TSLA_TOKEN,
    })
    render(<TDPBreadcrumb />)

    expect(screen.getByRole('link', { name: /Tokens/i })).toHaveAttribute('href', '/explore/tokens')
    expect(screen.queryByRole('link', { name: /Stocks/i })).not.toBeInTheDocument()
  })

  it('ignores location state from for RWA tokens so the trail stays consistent', () => {
    mockTDPStore(TSLA)
    mockUseLocation.mockReturnValue({
      ...defaultLocation,
      state: { from: '/explore/tokens/ethereum?category=stocks' },
    })
    mocked(useTDPRWAMatch).mockReturnValue({
      asset: TSLA_ASSET,
      token: TSLA_TOKEN,
    })
    render(<TDPBreadcrumb />)

    expect(screen.getByRole('link', { name: /Tokens/i })).toHaveAttribute('href', '/explore/tokens')
    expect(screen.getByRole('link', { name: /Stocks/i })).toHaveAttribute('href', '/explore/tokens?category=stocks')
  })
})
