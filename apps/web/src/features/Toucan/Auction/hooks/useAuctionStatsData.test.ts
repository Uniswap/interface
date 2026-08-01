import { renderHook } from '@testing-library/react'
import { Token } from '@uniswap/sdk-core'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuctionStatsData } from '~/features/Toucan/Auction/hooks/useAuctionStatsData'
import { AuctionDetails, BidTokenInfo } from '~/features/Toucan/Auction/store/types'

const mockUseStatsBannerData = vi.fn()
const mockUseQuery = vi.fn()
const mockStoreState = { auctionDetails: null as AuctionDetails | null, checkpointData: null }

vi.mock('~/features/Toucan/Auction/hooks/useStatsBannerData', () => ({
  useStatsBannerData: () => mockUseStatsBannerData(),
}))

vi.mock('~/features/Toucan/Auction/store/useAuctionStore', () => ({
  useAuctionStore: (selector: (state: typeof mockStoreState) => unknown) => selector(mockStoreState),
}))

vi.mock('uniswap/src/features/language/LocalizationContext', () => ({
  useLocalizationContext: () => ({
    formatPercent: (value: number) => `${value}%`,
  }),
}))

vi.mock('@tanstack/react-query', () => ({
  useQuery: () => mockUseQuery(),
}))

vi.mock('uniswap/src/data/apiClients/liquidityService/AuctionQueryClient', () => ({
  AuctionQueryClient: {},
}))

vi.mock('~/hooks/useBlockTimestamp', () => ({
  useBlockTimestamp: () => undefined,
}))

vi.mock('~/features/Toucan/Config/config', () => ({
  getAuctionMetadata: () => undefined,
}))

const CHAIN_ID = 1
const TOKEN_ADDRESS = '0x0000000000000000000000000000000000000001'
// 1 billion tokens with 18 decimals
const TOKEN_TOTAL_SUPPLY_RAW = (10n ** 27n).toString()

// "% Committed to LP" scenario reproducing the reported 456% overflow (18-decimal raw values).
// The LP allocation is drawn from the FULL token supply, so dividing it by the auctioned slice
// (200k of a 1M supply) yields 456%, while dividing by the full supply yields the correct 91%.
const FULL_SUPPLY_RAW = (1_000_000n * 10n ** 18n).toString()
const AUCTION_SLICE_SUPPLY_RAW = (200_000n * 10n ** 18n).toString()
const LP_ALLOCATION_RAW = (912_000n * 10n ** 18n).toString()

const bidTokenInfo: BidTokenInfo = {
  symbol: 'ETH',
  decimals: 18,
  priceFiat: 3000,
  isStablecoin: false,
  logoUrl: null,
}

function buildToken({ decimals, symbol, name }: { decimals: number; symbol?: string; name?: string }): CurrencyInfo {
  return {
    currency: new Token(CHAIN_ID, TOKEN_ADDRESS, decimals, symbol, name),
    currencyId: `${CHAIN_ID}-${TOKEN_ADDRESS}`,
    logoUrl: null,
  } as CurrencyInfo
}

function buildAuctionDetails({
  token,
  totalSupply = TOKEN_TOTAL_SUPPLY_RAW,
  tokenTotalSupply = TOKEN_TOTAL_SUPPLY_RAW,
}: {
  token: CurrencyInfo | undefined
  totalSupply?: string
  tokenTotalSupply?: string
}): AuctionDetails {
  return {
    auctionId: 'auction-1',
    chainId: CHAIN_ID,
    address: '0x0000000000000000000000000000000000000002',
    tokenAddress: TOKEN_ADDRESS,
    totalSupply,
    tokenTotalSupply,
    startBlock: '100',
    token,
  } as unknown as AuctionDetails
}

function mockStatsBanner(overrides: Partial<ReturnType<typeof buildStatsBannerFixture>> = {}) {
  mockUseStatsBannerData.mockReturnValue({ ...buildStatsBannerFixture(), ...overrides })
}

function buildStatsBannerFixture() {
  return {
    clearingPriceDecimal: 0.05,
    concentrationStartDecimal: null,
    concentrationEndDecimal: null,
    bidTokenInfo,
    currencyRaisedFormatted: null,
    requiredCurrencyFormatted: null,
    isLoading: false,
    isAuctionEnded: true,
    isAuctionNotStarted: false,
  }
}

describe('useAuctionStatsData', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockStatsBanner()
    mockUseQuery.mockReturnValue({ data: undefined })
  })

  it('formats supplies and implied price with resolved decimals (18)', () => {
    mockStoreState.auctionDetails = buildAuctionDetails({
      token: buildToken({ decimals: 18, symbol: 'TCAN', name: 'Toucan' }),
    })

    const { result } = renderHook(() => useAuctionStatsData())

    // 10^27 raw scaled by 18 decimals = 1 billion tokens
    expect(result.current.totalSupply).toBe('1B')
    expect(result.current.auctionSupply).toBe('1B')
    expect(result.current.impliedTokenPrice?.start).toMatch(/ETH$/)
  })

  it('falls back to placeholders while token metadata has not resolved (undefined decimals)', () => {
    mockStoreState.auctionDetails = buildAuctionDetails({ token: undefined })

    const { result } = renderHook(() => useAuctionStatsData())

    // Never renders the raw un-scaled supply (e.g. "1000000000000000T") by assuming decimals
    expect(result.current.totalSupply).toBeNull()
    expect(result.current.auctionSupply).toBeNull()
    expect(result.current.impliedTokenPrice).toBeNull()
  })

  it('falls back to placeholders for corrupt metadata (decimals=0 with empty name/symbol)', () => {
    mockStoreState.auctionDetails = buildAuctionDetails({ token: buildToken({ decimals: 0 }) })

    const { result } = renderHook(() => useAuctionStatsData())

    expect(result.current.totalSupply).toBeNull()
    expect(result.current.auctionSupply).toBeNull()
    expect(result.current.impliedTokenPrice).toBeNull()
  })

  it('keeps a legitimate 0-decimals token (real name/symbol) rendering', () => {
    mockStoreState.auctionDetails = buildAuctionDetails({
      token: buildToken({ decimals: 0, symbol: 'ZERO', name: 'Zero Decimals' }),
    })

    const { result } = renderHook(() => useAuctionStatsData())

    // 10^27 raw with 0 decimals really is 10^27 tokens
    expect(result.current.totalSupply).toBe('1000000000000000T')
  })

  it('divides the LP allocation by the full token supply, not the auctioned slice (no >100% overflow)', () => {
    mockStoreState.auctionDetails = buildAuctionDetails({
      token: buildToken({ decimals: 18, symbol: 'TCAN', name: 'Toucan' }),
      totalSupply: AUCTION_SLICE_SUPPLY_RAW,
      tokenTotalSupply: FULL_SUPPLY_RAW,
    })
    mockUseQuery.mockReturnValue({ data: { tokenCountAllocatedToLp: LP_ALLOCATION_RAW } })

    const { result } = renderHook(() => useAuctionStatsData())

    const formatted = result.current.percentCommittedToLpFormatted
    // Dividing by the auctioned slice used to yield '456%'; dividing by the full supply yields 91%.
    expect(formatted).toBe('91%')
    expect(formatted).not.toBe('456%')
    expect(Number(formatted?.replace('%', ''))).toBeLessThanOrEqual(100)
  })

  it('renders a placeholder (null) when the full token supply is unavailable', () => {
    const auctionDetails = buildAuctionDetails({
      token: buildToken({ decimals: 18, symbol: 'TCAN', name: 'Toucan' }),
      totalSupply: AUCTION_SLICE_SUPPLY_RAW,
    })
    // Simulate the RPC error case where tokenTotalSupply is absent; totalSupply stays set to
    // prove the calc does not silently fall back to the auctioned slice.
    ;(auctionDetails as { tokenTotalSupply?: string }).tokenTotalSupply = undefined
    mockStoreState.auctionDetails = auctionDetails
    mockUseQuery.mockReturnValue({ data: { tokenCountAllocatedToLp: LP_ALLOCATION_RAW } })

    const { result } = renderHook(() => useAuctionStatsData())

    expect(result.current.percentCommittedToLpFormatted).toBeNull()
  })
})
