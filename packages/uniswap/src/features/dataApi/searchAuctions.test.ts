import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { Auction, AuctionWithStats } from '@uniswap/client-data-api/dist/data/v1/auction_pb'
import { SearchAuction } from '@uniswap/client-data-api/dist/data/v1/searchTypes_pb'
import { createElement, type PropsWithChildren } from 'react'
import { OnchainItemListOptionType } from 'uniswap/src/components/lists/items/types'
import { fetchAuctionByAddress, useSearchTokensAndPoolsQuery } from 'uniswap/src/data/rest/searchTokensAndPools'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import {
  auctionWithStatsToAuctionOption,
  searchAuctionToAuctionOption,
  useSearchAuctions,
} from 'uniswap/src/features/dataApi/searchAuctions'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { useCurrencyInfos } from 'uniswap/src/features/tokens/useCurrencyInfo'

type OverrideMatch = { chainId: number; tokenAddress: string }
type FindAuctionOverrideMatches = (query: string) => OverrideMatch[]

const { actualFindAuctionOverrideMatches, mockFindAuctionOverrideMatches } = vi.hoisted(() => ({
  actualFindAuctionOverrideMatches: { current: undefined as FindAuctionOverrideMatches | undefined },
  mockFindAuctionOverrideMatches: vi.fn<FindAuctionOverrideMatches>(),
}))

vi.mock('@universe/gating', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/gating')>()),
  useDynamicConfigValue: vi.fn(() => []),
}))

vi.mock('uniswap/src/data/rest/searchTokensAndPools', () => ({
  fetchAuctionByAddress: vi.fn(),
  useSearchTokensAndPoolsQuery: vi.fn(),
}))

vi.mock('uniswap/src/features/chains/hooks/useEnabledChains', () => ({
  useEnabledChains: vi.fn(),
}))

vi.mock('uniswap/src/features/tokens/useCurrencyInfo', () => ({
  useCurrencyInfos: vi.fn(),
}))

vi.mock('uniswap/src/features/toucan/auctionMetadata', async (importOriginal) => {
  const actual = await importOriginal<typeof import('uniswap/src/features/toucan/auctionMetadata')>()
  actualFindAuctionOverrideMatches.current = actual.findAuctionOverrideMatches
  mockFindAuctionOverrideMatches.mockImplementation(actual.findAuctionOverrideMatches)
  return { ...actual, findAuctionOverrideMatches: mockFindAuctionOverrideMatches }
})

const mockFetchAuctionByAddress = vi.mocked(fetchAuctionByAddress)
const mockUseSearchTokensAndPoolsQuery = vi.mocked(useSearchTokensAndPoolsQuery)
const mockUseEnabledChains = vi.mocked(useEnabledChains)
const mockUseCurrencyInfos = vi.mocked(useCurrencyInfos)

const OCTRA_TOKEN_ADDRESS = '0x4647e1fe715c9e23959022c2416c71867f5a6e80'
const OTHER_TOKEN_ADDRESS = '0x0000000000000000000000000000000000000004'

function createWrapper(): ({ children }: PropsWithChildren) => JSX.Element {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return function Wrapper({ children }: PropsWithChildren): JSX.Element {
    return createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

function createSearchAuction({
  auctionId,
  chainId = UniverseChainId.Mainnet,
  tokenAddress = OTHER_TOKEN_ADDRESS,
  tokenName = 'Example Token',
}: {
  auctionId: string
  chainId?: UniverseChainId
  tokenAddress?: string
  tokenName?: string
}): SearchAuction {
  return new SearchAuction({
    auctionId,
    auctionAddress: '0x0000000000000000000000000000000000000001',
    chainId,
    tokenAddress,
    tokenName,
    tokenSymbol: 'EX',
  })
}

function createCurrencyInfo({
  name,
  symbol,
  logoUrl,
}: {
  name: string
  symbol: string
  logoUrl: string
}): CurrencyInfo {
  return {
    currency: { name, symbol },
    currencyId: '1-0x0000000000000000000000000000000000000000',
    logoUrl,
  } as unknown as CurrencyInfo
}

const mockPrimaryRefetch = vi.fn()

describe('auction override search', () => {
  beforeEach(() => {
    mockFindAuctionOverrideMatches.mockReset()
    mockFindAuctionOverrideMatches.mockImplementation((query) => {
      return actualFindAuctionOverrideMatches.current?.(query) ?? []
    })
    mockFetchAuctionByAddress.mockReset()
    mockUseSearchTokensAndPoolsQuery.mockReset()
    mockUseSearchTokensAndPoolsQuery.mockReturnValue({
      data: [],
      error: null,
      isPending: false,
      refetch: mockPrimaryRefetch,
    } as never)
    mockUseEnabledChains.mockReset()
    mockUseEnabledChains.mockReturnValue({
      chains: [UniverseChainId.Mainnet, UniverseChainId.Base],
      isTestnetModeEnabled: false,
    } as ReturnType<typeof useEnabledChains>)
    mockUseCurrencyInfos.mockReset()
    mockUseCurrencyInfos.mockReturnValue([])
    mockPrimaryRefetch.mockReset()
  })

  it('matches overridden names and symbols case-insensitively', () => {
    expect(actualFindAuctionOverrideMatches.current?.('OcTrA')).toEqual([
      { chainId: UniverseChainId.Mainnet, tokenAddress: OCTRA_TOKEN_ADDRESS },
    ])
    expect(actualFindAuctionOverrideMatches.current?.('oCt')).toEqual([
      { chainId: UniverseChainId.Mainnet, tokenAddress: OCTRA_TOKEN_ADDRESS },
    ])
  })

  it('requests exact matched addresses only on the active chain', async () => {
    const mainnetMatch = { chainId: UniverseChainId.Mainnet, tokenAddress: OCTRA_TOKEN_ADDRESS }
    const baseMatch = { chainId: UniverseChainId.Base, tokenAddress: OTHER_TOKEN_ADDRESS }
    const matchedAuction = createSearchAuction({
      auctionId: '1_0x0000000000000000000000000000000000000001',
      tokenAddress: OCTRA_TOKEN_ADDRESS,
    })
    mockFindAuctionOverrideMatches.mockReturnValue([mainnetMatch, baseMatch])
    mockFetchAuctionByAddress.mockResolvedValue(matchedAuction)

    const { result } = renderHook(
      () =>
        useSearchAuctions({
          searchQuery: 'octra',
          chainFilter: UniverseChainId.Mainnet,
          skip: false,
        }),
      { wrapper: createWrapper() },
    )

    await waitFor(() =>
      expect(result.current.data?.map((auction) => auction.auctionId)).toEqual([matchedAuction.auctionId]),
    )
    expect(mockFetchAuctionByAddress).toHaveBeenCalledTimes(1)
    expect(mockFetchAuctionByAddress).toHaveBeenCalledWith({
      chainId: UniverseChainId.Mainnet,
      address: OCTRA_TOKEN_ADDRESS,
    })
  })

  it('merges supplementary auctions after primary results and deduplicates by auction id', async () => {
    const primaryAuction = createSearchAuction({
      auctionId: '1_0x0000000000000000000000000000000000000001',
      tokenName: 'Primary auction',
    })
    const supplementaryDuplicate = createSearchAuction({
      auctionId: primaryAuction.auctionId,
      tokenName: 'Supplementary duplicate',
    })
    const supplementaryAuction = createSearchAuction({
      auctionId: '1_0x0000000000000000000000000000000000000002',
      tokenName: 'Supplementary auction',
    })
    mockUseSearchTokensAndPoolsQuery.mockReturnValue({
      data: [primaryAuction],
      error: null,
      isPending: false,
      refetch: mockPrimaryRefetch,
    } as never)
    mockFindAuctionOverrideMatches.mockReturnValue([
      { chainId: UniverseChainId.Mainnet, tokenAddress: OCTRA_TOKEN_ADDRESS },
      { chainId: UniverseChainId.Mainnet, tokenAddress: OTHER_TOKEN_ADDRESS },
    ])
    mockFetchAuctionByAddress.mockResolvedValueOnce(supplementaryDuplicate).mockResolvedValueOnce(supplementaryAuction)

    const { result } = renderHook(
      () =>
        useSearchAuctions({
          searchQuery: 'octra',
          chainFilter: null,
          skip: false,
        }),
      { wrapper: createWrapper() },
    )

    await waitFor(() =>
      expect(result.current.data?.map(({ auctionId, tokenName }) => ({ auctionId, tokenName }))).toEqual([
        { auctionId: primaryAuction.auctionId, tokenName: 'Primary auction' },
        { auctionId: supplementaryAuction.auctionId, tokenName: 'Supplementary auction' },
      ]),
    )
  })

  it('keeps fulfilled override lookups when another address lookup fails', async () => {
    const successfulAuction = createSearchAuction({
      auctionId: '1_0x0000000000000000000000000000000000000002',
    })
    mockFindAuctionOverrideMatches.mockReturnValue([
      { chainId: UniverseChainId.Mainnet, tokenAddress: OCTRA_TOKEN_ADDRESS },
      { chainId: UniverseChainId.Mainnet, tokenAddress: OTHER_TOKEN_ADDRESS },
    ])
    mockFetchAuctionByAddress.mockRejectedValueOnce(new Error('lookup failed')).mockResolvedValueOnce(successfulAuction)

    const { result } = renderHook(
      () =>
        useSearchAuctions({
          searchQuery: 'auction',
          chainFilter: null,
          skip: false,
        }),
      { wrapper: createWrapper() },
    )

    await waitFor(() =>
      expect(result.current.data?.map((auction) => auction.auctionId)).toEqual([successfulAuction.auctionId]),
    )
  })

  it('returns a stable refetch callback that refreshes both auction queries', async () => {
    mockFindAuctionOverrideMatches.mockReturnValue([
      { chainId: UniverseChainId.Mainnet, tokenAddress: OCTRA_TOKEN_ADDRESS },
    ])
    mockFetchAuctionByAddress.mockResolvedValue(
      createSearchAuction({
        auctionId: '1_0x0000000000000000000000000000000000000001',
        tokenAddress: OCTRA_TOKEN_ADDRESS,
      }),
    )

    const { result, rerender } = renderHook(
      () =>
        useSearchAuctions({
          searchQuery: 'octra',
          chainFilter: null,
          skip: false,
        }),
      { wrapper: createWrapper() },
    )
    await waitFor(() => expect(mockFetchAuctionByAddress).toHaveBeenCalledTimes(1))
    const initialRefetch = result.current.refetch

    rerender()
    expect(result.current.refetch).toBe(initialRefetch)

    await act(async () => {
      await result.current.refetch?.()
    })
    expect(mockPrimaryRefetch).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(mockFetchAuctionByAddress).toHaveBeenCalledTimes(2))
  })
})

describe('searchAuctions', () => {
  describe(searchAuctionToAuctionOption, () => {
    it('uses the explicit auction address when present', () => {
      const option = searchAuctionToAuctionOption({
        auction: new SearchAuction({
          auctionId: '1_0x0000000000000000000000000000000000000001',
          chainId: UniverseChainId.Mainnet,
          auctionAddress: '0x0000000000000000000000000000000000000002',
          tokenAddress: '0x0000000000000000000000000000000000000003',
          tokenName: 'Example Token',
          tokenSymbol: 'EX',
        }),
        currencyInfo: null,
        isVerified: true,
      })

      expect(option).toMatchObject({
        type: OnchainItemListOptionType.Auction,
        auctionAddress: '0x0000000000000000000000000000000000000002',
        isVerified: true,
      })
    })

    it('falls back to the routeable address encoded in the auction id', () => {
      const option = searchAuctionToAuctionOption({
        auction: new SearchAuction({
          auctionId: '1_0x0000000000000000000000000000000000000001',
          chainId: UniverseChainId.Mainnet,
          tokenAddress: '0x0000000000000000000000000000000000000003',
          tokenName: 'Example Token',
          tokenSymbol: 'EX',
        }),
        currencyInfo: null,
        isVerified: false,
      })

      expect(option.auctionAddress).toBe('0x0000000000000000000000000000000000000001')
    })

    it('ignores malformed auction ids when the explicit auction address is missing', () => {
      const option = searchAuctionToAuctionOption({
        auction: new SearchAuction({
          auctionId: '1_0x0000000000000000000000000000000000000001_extra',
          chainId: UniverseChainId.Mainnet,
          tokenAddress: '0x0000000000000000000000000000000000000003',
          tokenName: 'Example Token',
          tokenSymbol: 'EX',
        }),
        currencyInfo: null,
        isVerified: false,
      })

      expect(option.auctionAddress).toBe('')
    })

    it('applies auction metadata overrides before API and currency metadata', () => {
      const option = searchAuctionToAuctionOption({
        auction: new SearchAuction({
          auctionId: '1_0x20eEBd78151EAe9Ed2380AC613204aaF5CA0cd24',
          chainId: UniverseChainId.Mainnet,
          auctionAddress: '0x20eEBd78151EAe9Ed2380AC613204aaF5CA0cd24',
          tokenAddress: '0x4647e1fe715c9e23959022c2416c71867f5a6e80',
          tokenName: 'Wrapped OCT',
          tokenSymbol: 'WOCT',
          totalBidVolumeUsd: '123.45',
        }),
        currencyInfo: createCurrencyInfo({
          name: 'Wrapped OCT',
          symbol: 'WOCT',
          logoUrl: 'https://example.com/wrapped-oct.png',
        }),
        isVerified: true,
      })

      expect(option).toMatchObject({
        type: OnchainItemListOptionType.Auction,
        tokenName: 'Octra',
        tokenSymbol: 'OCT',
        tokenLogoUrl: '/images/logos/octra-token-launch-logo.svg',
        committedVolumeUsd: 123.45,
        isVerified: true,
      })
    })

    it('falls back to currency metadata before raw search auction metadata', () => {
      const currencyInfo = createCurrencyInfo({
        name: 'Currency Name',
        symbol: 'CUR',
        logoUrl: 'https://example.com/currency-logo.png',
      })

      const option = searchAuctionToAuctionOption({
        auction: new SearchAuction({
          auctionId: '1_0x0000000000000000000000000000000000000001',
          chainId: UniverseChainId.Mainnet,
          auctionAddress: '0x0000000000000000000000000000000000000001',
          tokenAddress: '0x0000000000000000000000000000000000000002',
          tokenName: 'Raw API Name',
          tokenSymbol: 'RAW',
          totalBidVolumeUsd: '20',
        }),
        currencyInfo,
        isVerified: false,
      })

      expect(option.tokenName).toBe('Currency Name')
      expect(option.tokenSymbol).toBe('CUR')
      expect(option.tokenLogoUrl).toBe('https://example.com/currency-logo.png')
      expect(option.currencyInfo).toBe(currencyInfo)
    })
  })

  describe(auctionWithStatsToAuctionOption, () => {
    it('returns undefined when the auction stats response has no auction', () => {
      expect(
        auctionWithStatsToAuctionOption({
          auctionWithStats: new AuctionWithStats(),
          currencyInfo: null,
          isVerified: false,
        }),
      ).toBeUndefined()
    })

    it('maps top auction stats into auction options with metadata overrides', () => {
      const option = auctionWithStatsToAuctionOption({
        auctionWithStats: new AuctionWithStats({
          auction: new Auction({
            auctionId: '1_0x9084CB9a700a52909Cbef3113dB8BaC01C01EfD6',
            chainId: UniverseChainId.Mainnet,
            address: '0x9084CB9a700a52909Cbef3113dB8BaC01C01EfD6',
            tokenAddress: '0x9999B7E3cc6979223Ff1aF980b7D8B90B75d9999',
            tokenName: 'Cap',
            tokenSymbol: 'CAP',
            totalBidVolumeUsd: '456.78',
          }),
        }),
        currencyInfo: null,
        isVerified: true,
      })

      expect(option).toMatchObject({
        type: OnchainItemListOptionType.Auction,
        auctionId: '1_0x9084CB9a700a52909Cbef3113dB8BaC01C01EfD6',
        auctionAddress: '0x9084CB9a700a52909Cbef3113dB8BaC01C01EfD6',
        chainId: UniverseChainId.Mainnet,
        tokenAddress: '0x9999B7E3cc6979223Ff1aF980b7D8B90B75d9999',
        tokenName: 'Cap',
        tokenSymbol: 'CAP',
        tokenLogoUrl: '/images/logos/cap-token-launch-logo.png',
        committedVolumeUsd: 456.78,
        isVerified: true,
      })
    })
  })
})
