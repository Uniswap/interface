import { Timestamp, type PlainMessage } from '@bufbuild/protobuf'
import { renderHook } from '@testing-library/react'
import { AuctionLifecycle, SearchAuction } from '@uniswap/client-data-api/dist/data/v2/search_pb'
import { LaunchMethod } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { Auction, AuctionType, AuctionWithStats } from '@uniswap/client-launches/dist/data/v1/auction_pb'
import { UniverseChainId } from '@universe/chains'
import { OnchainItemListOptionType } from 'uniswap/src/components/lists/items/types'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { LaunchProvenanceMethod } from 'uniswap/src/features/dataApi/launchProvenance'
import {
  auctionWithStatsToAuctionOption,
  searchAuctionToAuctionOption,
  useSearchAuctionOptions,
  type SearchAuctionResult,
} from 'uniswap/src/features/dataApi/searchAuctions'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { useCurrencyInfos } from 'uniswap/src/features/tokens/useCurrencyInfo'

vi.mock('@universe/gating', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/gating')>()),
  useDynamicConfigValue: vi.fn(() => []),
}))

vi.mock('uniswap/src/features/chains/hooks/useEnabledChains', () => ({
  useEnabledChains: vi.fn(),
}))

vi.mock('uniswap/src/features/tokens/useCurrencyInfo', () => ({
  useCurrencyInfos: vi.fn(),
}))

const mockUseEnabledChains = vi.mocked(useEnabledChains)
const mockUseCurrencyInfos = vi.mocked(useCurrencyInfos)

const OTHER_TOKEN_ADDRESS = '0x0000000000000000000000000000000000000004'
const HIDDEN_AUCTION_ID = '1_0xD9E8355f9f57185928347a5BdDEe164006b16e58' // Abandoned Interfold auction.

function createSearchAuction({
  auctionId,
  chainId = UniverseChainId.Mainnet,
  tokenAddress = OTHER_TOKEN_ADDRESS,
  tokenName = 'Example Token',
  lifecycle,
}: {
  auctionId: string
  chainId?: UniverseChainId
  tokenAddress?: string
  tokenName?: string
  lifecycle?: AuctionLifecycle
}): SearchAuction {
  return new SearchAuction({
    auctionId,
    auctionAddress: '0x0000000000000000000000000000000000000001',
    chainId,
    tokenAddress,
    tokenName,
    tokenSymbol: 'EX',
    lifecycle,
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

describe(useSearchAuctionOptions, () => {
  beforeEach(() => {
    mockUseEnabledChains.mockReset()
    mockUseEnabledChains.mockReturnValue({
      chains: [UniverseChainId.Mainnet, UniverseChainId.Base],
      isTestnetModeEnabled: false,
    } as ReturnType<typeof useEnabledChains>)
    mockUseCurrencyInfos.mockReset()
    mockUseCurrencyInfos.mockReturnValue([])
  })

  it.each([
    [true, ['1_0x0000000000000000000000000000000000000011', '1_0x0000000000000000000000000000000000000012']],
    [
      false,
      [
        '1_0x0000000000000000000000000000000000000011',
        '1_0x0000000000000000000000000000000000000012',
        '1_0x0000000000000000000000000000000000000013',
        '1_0x0000000000000000000000000000000000000014',
      ],
    ],
  ])('alongside tokens %s, keeps ended auctions only on the Auctions tab', (alongsideTokens, expectedIds) => {
    const auctions = [
      createSearchAuction({
        auctionId: '1_0x0000000000000000000000000000000000000011',
        lifecycle: AuctionLifecycle.LIVE,
      }),
      createSearchAuction({
        auctionId: '1_0x0000000000000000000000000000000000000012',
        lifecycle: AuctionLifecycle.UPCOMING,
      }),
      createSearchAuction({
        auctionId: '1_0x0000000000000000000000000000000000000013',
        lifecycle: AuctionLifecycle.FAILED,
      }),
      createSearchAuction({
        auctionId: '1_0x0000000000000000000000000000000000000014',
        lifecycle: AuctionLifecycle.GRADUATED,
      }),
    ]

    const { result } = renderHook(() => useSearchAuctionOptions({ auctions, alongsideTokens, skip: false }))

    expect(result.current.map((auction) => auction.auctionId)).toEqual(expectedIds)
  })

  it('drops hidden auctions', () => {
    const visibleAuction = createSearchAuction({ auctionId: '1_0x0000000000000000000000000000000000000002' })

    const { result } = renderHook(() =>
      useSearchAuctionOptions({
        auctions: [createSearchAuction({ auctionId: HIDDEN_AUCTION_ID }), visibleAuction],
        alongsideTokens: false,
        skip: false,
      }),
    )

    expect(result.current.map((auction) => auction.auctionId)).toEqual([visibleAuction.auctionId])
  })

  it('returns no options when auction search is skipped', () => {
    const { result } = renderHook(() =>
      useSearchAuctionOptions({
        auctions: [createSearchAuction({ auctionId: '1_0x0000000000000000000000000000000000000002' })],
        alongsideTokens: false,
        skip: true,
      }),
    )

    expect(result.current).toEqual([])
  })

  it('carries the v2 payload committed volume and start/end times onto the row options', () => {
    const startTime = new Date('2026-09-04T12:00:00Z')
    const endTime = new Date('2026-09-04T16:00:00Z')
    const v2Auction = new SearchAuction({
      auctionId: '1_0x0000000000000000000000000000000000000009',
      auctionAddress: '0x0000000000000000000000000000000000000009',
      chainId: UniverseChainId.Mainnet,
      tokenAddress: OTHER_TOKEN_ADDRESS,
      tokenSymbol: 'EX',
      totalBidVolumeUsd: '1234567.89',
      estimatedStartTime: Timestamp.fromDate(startTime),
      estimatedEndTime: Timestamp.fromDate(endTime),
    })

    const { result } = renderHook(() =>
      useSearchAuctionOptions({ auctions: [v2Auction], alongsideTokens: false, skip: false }),
    )

    expect(result.current).toHaveLength(1)
    expect(result.current[0]?.searchStats).toEqual({
      committedVolumeUsd: 1234567.89,
      startTimeMs: startTime.getTime(),
      endTimeMs: endTime.getTime(),
    })
  })
})

describe('searchAuctions', () => {
  it('keeps the v1 SearchAuction proto assignable to the v2 shape', () => {
    // SearchAuctionResult is the plain v2 shape; v1 messages flow through v2-typed helpers on
    // structural assignability alone, so pin the two protos to each other. v2 only adds the
    // optional row stats (fdv_usd, estimated_end_time). If either drifts further, this literal
    // stops typechecking.
    type MutuallyAssignable<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false
    const protosMatch: MutuallyAssignable<PlainMessage<SearchAuction>, SearchAuctionResult> = true
    expect(protosMatch).toBe(true)
  })

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

    it('maps committed volume and the estimated end time from the v2 payload into the row stats', () => {
      const endTime = new Date('2026-09-04T16:00:00Z')
      const option = searchAuctionToAuctionOption({
        auction: new SearchAuction({
          auctionId: '1_0x9084CB9a700a52909Cbef3113dB8BaC01C01EfD6',
          chainId: UniverseChainId.Mainnet,
          auctionAddress: '0x9084CB9a700a52909Cbef3113dB8BaC01C01EfD6',
          tokenAddress: '0x9999B7E3cc6979223Ff1aF980b7D8B90B75d9999',
          tokenSymbol: 'CAP',
          totalBidVolumeUsd: '1234567.89',
          estimatedEndTime: Timestamp.fromDate(endTime),
        }),
        currencyInfo: null,
        isVerified: false,
      })

      expect(option.searchStats).toEqual({ committedVolumeUsd: 1234567.89, endTimeMs: endTime.getTime() })
    })

    it('maps the bidder count and launch method from the v2 payload', () => {
      const option = searchAuctionToAuctionOption({
        auction: new SearchAuction({
          auctionId: '1_0xfFDab1083fCbBCEE32997795388B3D61Ebab786E',
          chainId: UniverseChainId.Mainnet,
          auctionAddress: '0xfFDab1083fCbBCEE32997795388B3D61Ebab786E',
          tokenAddress: '0x4c93B9FbF7Fd1777CCBcBc538B1d0a8b58fB1ad6',
          tokenSymbol: 'STRATO',
          bidderCount: 292,
          launchProvenance: {
            launchpad: { id: 'uniswap-cca', name: 'Uniswap CCA' },
            launchMethod: LaunchMethod.CUSTOM,
          },
        }),
        currencyInfo: null,
        isVerified: false,
      })

      expect(option).toMatchObject({ uniqueBidderCount: 292, launchMethod: LaunchProvenanceMethod.CustomAuction })
    })

    it.each([
      [AuctionLifecycle.GRADUATED, true, undefined],
      [AuctionLifecycle.FAILED, true, undefined],
      [AuctionLifecycle.UPCOMING, undefined, true],
      [AuctionLifecycle.LIVE, undefined, undefined],
    ])('marks lifecycle %s as ended: %s, upcoming: %s', (lifecycle, isEnded, isUpcoming) => {
      const option = searchAuctionToAuctionOption({
        auction: new SearchAuction({
          auctionId: '1_0x9084CB9a700a52909Cbef3113dB8BaC01C01EfD6',
          chainId: UniverseChainId.Mainnet,
          tokenAddress: '0x9999B7E3cc6979223Ff1aF980b7D8B90B75d9999',
          tokenSymbol: 'CAP',
          totalBidVolumeUsd: '1',
          lifecycle,
        }),
        currencyInfo: null,
        isVerified: false,
      })

      expect(option.searchStats?.isEnded).toBe(isEnded)
      expect(option.searchStats?.isUpcoming).toBe(isUpcoming)
    })

    it('leaves the row stats unset when the payload omits both', () => {
      const option = searchAuctionToAuctionOption({
        auction: new SearchAuction({
          auctionId: '1_0x9084CB9a700a52909Cbef3113dB8BaC01C01EfD6',
          chainId: UniverseChainId.Mainnet,
          auctionAddress: '0x9084CB9a700a52909Cbef3113dB8BaC01C01EfD6',
          tokenAddress: '0x9999B7E3cc6979223Ff1aF980b7D8B90B75d9999',
          tokenSymbol: 'CAP',
        }),
        currencyInfo: null,
        isVerified: false,
      })

      expect(option.searchStats).toBeUndefined()
    })
  })

  describe(auctionWithStatsToAuctionOption, () => {
    it('returns undefined when the auction stats response has no auction', () => {
      expect(
        auctionWithStatsToAuctionOption({
          auctionWithStats: new AuctionWithStats(),
          currencyInfo: null,
          isVerified: false,
          isEnded: false,
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
          uniqueBidderCount: 982,
        }),
        currencyInfo: null,
        isVerified: true,
        isEnded: false,
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
        uniqueBidderCount: 982,
        isVerified: true,
      })
    })

    it('maps committed volume and the estimated end time into the row stats', () => {
      const endTime = new Date('2026-09-04T16:00:00Z')
      const option = auctionWithStatsToAuctionOption({
        auctionWithStats: new AuctionWithStats({
          auction: new Auction({
            auctionId: '1_0x9084CB9a700a52909Cbef3113dB8BaC01C01EfD6',
            chainId: UniverseChainId.Mainnet,
            address: '0x9084CB9a700a52909Cbef3113dB8BaC01C01EfD6',
            tokenAddress: '0x9999B7E3cc6979223Ff1aF980b7D8B90B75d9999',
            tokenSymbol: 'CAP',
            totalBidVolumeUsd: '1234567.89',
            estimatedEndTime: Timestamp.fromDate(endTime),
          }),
        }),
        currencyInfo: null,
        isVerified: false,
        isEnded: false,
      })

      expect(option?.searchStats).toEqual({ committedVolumeUsd: 1234567.89, endTimeMs: endTime.getTime() })
    })

    it('maps the auction type to the launch method', () => {
      const option = auctionWithStatsToAuctionOption({
        auctionWithStats: new AuctionWithStats({
          auction: new Auction({
            auctionId: '1_0x9084CB9a700a52909Cbef3113dB8BaC01C01EfD6',
            chainId: UniverseChainId.Mainnet,
            tokenAddress: '0x9999B7E3cc6979223Ff1aF980b7D8B90B75d9999',
            tokenSymbol: 'CAP',
            auctionType: AuctionType.CROWD,
          }),
        }),
        currencyInfo: null,
        isVerified: false,
        isEnded: false,
      })

      expect(option?.launchMethod).toBe(LaunchProvenanceMethod.CrowdLaunch)
    })

    it('marks an auction from the completed listing as ended though the listing omits its times', () => {
      const option = auctionWithStatsToAuctionOption({
        auctionWithStats: new AuctionWithStats({
          auction: new Auction({
            auctionId: '1_0x9084CB9a700a52909Cbef3113dB8BaC01C01EfD6',
            chainId: UniverseChainId.Mainnet,
            tokenAddress: '0x9999B7E3cc6979223Ff1aF980b7D8B90B75d9999',
            tokenSymbol: 'CAP',
          }),
        }),
        currencyInfo: null,
        isVerified: false,
        isEnded: true,
      })

      expect(option?.searchStats).toEqual({ isEnded: true })
    })

    it('leaves the row stats unset when the listing omits both', () => {
      const option = auctionWithStatsToAuctionOption({
        auctionWithStats: new AuctionWithStats({
          auction: new Auction({
            auctionId: '1_0x9084CB9a700a52909Cbef3113dB8BaC01C01EfD6',
            chainId: UniverseChainId.Mainnet,
            address: '0x9084CB9a700a52909Cbef3113dB8BaC01C01EfD6',
            tokenAddress: '0x9999B7E3cc6979223Ff1aF980b7D8B90B75d9999',
            tokenSymbol: 'CAP',
          }),
        }),
        currencyInfo: null,
        isVerified: false,
        isEnded: false,
      })

      expect(option?.searchStats).toBeUndefined()
    })
  })
})
