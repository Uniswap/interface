import { OnchainItemListOptionType, type SearchModalOption } from 'uniswap/src/components/lists/items/types'
import type { OnchainItemSection } from 'uniswap/src/components/lists/OnchainItemList/types'
import { OnchainItemSectionName } from 'uniswap/src/components/lists/OnchainItemList/types'
import { normalizeTokenAddressForCache } from 'uniswap/src/data/cache'
import type { ChainToken, IssuerToken, Rwa } from 'uniswap/src/data/rest/rwa/types'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import {
  collectRwaIssuerPrimaryCurrencyIds,
  gatherRwaIssuerPrimaryCurrencyIds,
  getRwaIssuerCurrencyInfo,
  getRwaIssuerPrimaryCurrencyId,
  useRwaIssuerCurrencyInfos,
} from 'uniswap/src/features/search/SearchModal/stocks/useRwaIssuerCurrencyInfos'
import { useCurrencyInfos } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { renderHook } from 'uniswap/src/test/test-utils'

vi.mock('uniswap/src/features/chains/hooks/useEnabledChains', () => ({ useEnabledChains: vi.fn() }))
vi.mock('uniswap/src/features/tokens/useCurrencyInfo', () => ({ useCurrencyInfos: vi.fn() }))

const mockUseEnabledChains = vi.mocked(useEnabledChains)
const mockUseCurrencyInfos = vi.mocked(useCurrencyInfos)

const MAINNET = UniverseChainId.Mainnet
const ARBITRUM = UniverseChainId.ArbitrumOne
const ENABLED: readonly UniverseChainId[] = [MAINNET, ARBITRUM]

const ADDR_A = '0xAAAaaaAAaAAaAaAAAaaAAaAaaaaAAAAaAAAAaAAA'
const ADDR_C = '0xCCCcccCCCcccCCCccCccCCCCcCcCCCCccccCCCcc'

function makeIssuer({ issuer, chainTokens }: { issuer: string; chainTokens: ChainToken[] }): IssuerToken {
  return {
    symbol: issuer.toUpperCase(),
    name: `${issuer} Tesla`,
    logoUrl: '',
    issuer,
    priceUsd: 1,
    volume24hUsd: 0,
    sparkline1d: { points: [] },
    chainTokens,
  }
}

function makeRwa({ issuerTokens }: { issuerTokens: IssuerToken[] }): Rwa {
  return {
    symbol: 'TSLA',
    name: 'Tesla',
    logoUrl: '',
    priceUsd: 1,
    volume24hUsd: 0,
    sparkline1d: { points: [] },
    issuerTokens,
  }
}

const issuerA = makeIssuer({ issuer: 'ondo', chainTokens: [{ chainId: MAINNET, address: ADDR_A }] })
const issuerC = makeIssuer({ issuer: 'backed', chainTokens: [{ chainId: MAINNET, address: ADDR_C }] })

describe('collectRwaIssuerPrimaryCurrencyIds', () => {
  it('returns one primary-chain currencyId per issuer (mainnet-first)', () => {
    const rwa = makeRwa({ issuerTokens: [issuerA, issuerC] })
    expect(collectRwaIssuerPrimaryCurrencyIds({ rwa, enabledChainIds: ENABLED })).toEqual([
      `${MAINNET}-${ADDR_A}`,
      `${MAINNET}-${ADDR_C}`,
    ])
  })

  it('drops issuers with no enabled chain', () => {
    const offChainIssuer = makeIssuer({
      issuer: 'ondo',
      chainTokens: [{ chainId: UniverseChainId.Polygon, address: ADDR_A }],
    })
    const rwa = makeRwa({ issuerTokens: [offChainIssuer, issuerC] })
    expect(collectRwaIssuerPrimaryCurrencyIds({ rwa, enabledChainIds: ENABLED })).toEqual([`${MAINNET}-${ADDR_C}`])
  })

  it('dedupes issuers that resolve to the same normalized currencyId', () => {
    const lowerCaseDup = makeIssuer({
      issuer: 'dup',
      chainTokens: [{ chainId: MAINNET, address: normalizeTokenAddressForCache(ADDR_A) }],
    })
    const rwa = makeRwa({ issuerTokens: [issuerA, lowerCaseDup] })
    expect(collectRwaIssuerPrimaryCurrencyIds({ rwa, enabledChainIds: ENABLED })).toEqual([`${MAINNET}-${ADDR_A}`])
  })
})

describe('gatherRwaIssuerPrimaryCurrencyIds', () => {
  it('dedupes across RwaCollection options and ignores non-RWA options', () => {
    const rwa1 = makeRwa({ issuerTokens: [issuerA, issuerC] })
    const rwa2 = makeRwa({ issuerTokens: [issuerA] })
    const options: SearchModalOption[] = [
      { type: OnchainItemListOptionType.RwaCollection, rwa: rwa1 } as unknown as SearchModalOption,
      { type: OnchainItemListOptionType.RwaCollection, rwa: rwa2 } as unknown as SearchModalOption,
      { type: OnchainItemListOptionType.Token } as unknown as SearchModalOption,
    ]
    expect(gatherRwaIssuerPrimaryCurrencyIds({ options, enabledChainIds: ENABLED })).toEqual([
      `${MAINNET}-${ADDR_A}`,
      `${MAINNET}-${ADDR_C}`,
    ])
  })

  it('returns an empty array when there are no RwaCollection options', () => {
    const options: SearchModalOption[] = [{ type: OnchainItemListOptionType.Token } as unknown as SearchModalOption]
    expect(gatherRwaIssuerPrimaryCurrencyIds({ options, enabledChainIds: ENABLED })).toEqual([])
  })
})

describe('getRwaIssuerPrimaryCurrencyId', () => {
  it('returns the normalized map key for an issuer with an enabled primary chain', () => {
    expect(getRwaIssuerPrimaryCurrencyId({ issuer: issuerA, enabledChainIds: ENABLED })).toBe(
      `${MAINNET}-${normalizeTokenAddressForCache(ADDR_A)}`,
    )
  })

  it('returns undefined when the issuer has no enabled chain', () => {
    const offChainIssuer = makeIssuer({
      issuer: 'ondo',
      chainTokens: [{ chainId: UniverseChainId.Polygon, address: ADDR_A }],
    })
    expect(getRwaIssuerPrimaryCurrencyId({ issuer: offChainIssuer, enabledChainIds: ENABLED })).toBeUndefined()
  })
})

function makeCurrencyInfo({ currencyId }: { currencyId: string }): CurrencyInfo {
  return { currencyId } as unknown as CurrencyInfo
}

function makeSection(options: SearchModalOption[]): OnchainItemSection<SearchModalOption> {
  return { sectionKey: OnchainItemSectionName.Tokens, data: options }
}

const ADDR_B = '0xBBBbbbBBbbBbBBBBBbbBBbBbbbbbBBBBbBBBbBBB'
// CurrencyInfo carries the RAW (checksummed) currencyId; the hook normalizes it for the Map key.
const ciA = makeCurrencyInfo({ currencyId: `${MAINNET}-${ADDR_A}` })
const ciC = makeCurrencyInfo({ currencyId: `${MAINNET}-${ADDR_C}` })

beforeEach(() => {
  vi.clearAllMocks()
  mockUseEnabledChains.mockReturnValue({ chains: [...ENABLED] } as unknown as ReturnType<typeof useEnabledChains>)
  mockUseCurrencyInfos.mockReturnValue([])
})

describe(useRwaIssuerCurrencyInfos, () => {
  it('queries the gathered primary currencyIds across the rendered sections', () => {
    const rwa = makeRwa({ issuerTokens: [issuerA, issuerC] })
    const sections = [
      makeSection([{ type: OnchainItemListOptionType.RwaCollection, rwa } as unknown as SearchModalOption]),
    ]
    renderHook(() => useRwaIssuerCurrencyInfos({ sections }))
    expect(mockUseCurrencyInfos).toHaveBeenCalledWith([`${MAINNET}-${ADDR_A}`, `${MAINNET}-${ADDR_C}`])
  })

  it('queries with an empty array when there are no RwaCollection options (zero cost)', () => {
    const sections = [makeSection([{ type: OnchainItemListOptionType.Token } as unknown as SearchModalOption])]
    renderHook(() => useRwaIssuerCurrencyInfos({ sections }))
    expect(mockUseCurrencyInfos).toHaveBeenCalledWith([])
  })

  it('builds the Map from only the resolved entries, skipping interleaved positional holes', () => {
    const rwa = makeRwa({ issuerTokens: [issuerA, issuerC] })
    const sections = [
      makeSection([{ type: OnchainItemListOptionType.RwaCollection, rwa } as unknown as SearchModalOption]),
    ]
    // useCurrencyInfos returns an index-aligned array with NULLABLE holes (gql `tokens: [Token]`).
    // The middle hole (a chain whose token did not resolve) must be skipped.
    mockUseCurrencyInfos.mockReturnValue([ciA, undefined, ciC])

    const { result } = renderHook(() => useRwaIssuerCurrencyInfos({ sections }))

    expect(result.current.size).toBe(2)
    expect([...result.current.keys()].sort()).toEqual(
      [
        `${MAINNET}-${normalizeTokenAddressForCache(ADDR_A)}`,
        `${MAINNET}-${normalizeTokenAddressForCache(ADDR_C)}`,
      ].sort(),
    )
    expect(result.current.get(`${MAINNET}-${normalizeTokenAddressForCache(ADDR_A)}`)).toBe(ciA)
    expect(result.current.get(`${MAINNET}-${normalizeTokenAddressForCache(ADDR_C)}`)).toBe(ciC)
    // The hole did not become a key.
    expect(result.current.has(`${MAINNET}-${normalizeTokenAddressForCache(ADDR_B)}`)).toBe(false)
  })
})

describe('useRwaIssuerCurrencyInfos searchMultichainParent', () => {
  it('attaches searchMultichainParent when an issuer is deployed on more than one chain', () => {
    const multichainIssuer = makeIssuer({
      issuer: 'ondo',
      chainTokens: [
        { chainId: MAINNET, address: ADDR_A },
        { chainId: ARBITRUM, address: ADDR_B },
      ],
    })
    const rwa = makeRwa({ issuerTokens: [multichainIssuer] })
    const sections = [
      makeSection([{ type: OnchainItemListOptionType.RwaCollection, rwa } as unknown as SearchModalOption]),
    ]
    mockUseCurrencyInfos.mockReturnValue([ciA])

    const { result } = renderHook(() => useRwaIssuerCurrencyInfos({ sections }))

    const key = `${MAINNET}-${normalizeTokenAddressForCache(ADDR_A)}`
    expect(result.current.get(key)?.searchMultichainParent).toEqual({
      id: key,
      tokenCurrencyIds: [`${MAINNET}-${ADDR_A}`, `${ARBITRUM}-${ADDR_B}`],
    })
  })

  it('leaves a single-chain issuer untouched (identity-preserving)', () => {
    const rwa = makeRwa({ issuerTokens: [issuerA] })
    const sections = [
      makeSection([{ type: OnchainItemListOptionType.RwaCollection, rwa } as unknown as SearchModalOption]),
    ]
    mockUseCurrencyInfos.mockReturnValue([ciA])

    const { result } = renderHook(() => useRwaIssuerCurrencyInfos({ sections }))

    const key = `${MAINNET}-${normalizeTokenAddressForCache(ADDR_A)}`
    expect(result.current.get(key)).toBe(ciA)
  })

  it('excludes chain tokens with an unsupported chainId, and omits the parent when only one valid id remains', () => {
    const issuerWithUnsupportedChain = makeIssuer({
      issuer: 'ondo',
      chainTokens: [
        { chainId: MAINNET, address: ADDR_A },
        { chainId: 999_999_999, address: ADDR_B },
      ],
    })
    const rwa = makeRwa({ issuerTokens: [issuerWithUnsupportedChain] })
    const sections = [
      makeSection([{ type: OnchainItemListOptionType.RwaCollection, rwa } as unknown as SearchModalOption]),
    ]
    mockUseCurrencyInfos.mockReturnValue([ciA])

    const { result } = renderHook(() => useRwaIssuerCurrencyInfos({ sections }))

    const key = `${MAINNET}-${normalizeTokenAddressForCache(ADDR_A)}`
    expect(result.current.get(key)?.searchMultichainParent).toBeUndefined()
  })

  it('excludes chain tokens on disabled chains, and omits the parent when only one enabled id remains', () => {
    const issuerWithDisabledChain = makeIssuer({
      issuer: 'ondo',
      chainTokens: [
        { chainId: MAINNET, address: ADDR_A },
        { chainId: UniverseChainId.Polygon, address: ADDR_B },
      ],
    })
    const rwa = makeRwa({ issuerTokens: [issuerWithDisabledChain] })
    const sections = [
      makeSection([{ type: OnchainItemListOptionType.RwaCollection, rwa } as unknown as SearchModalOption]),
    ]
    mockUseCurrencyInfos.mockReturnValue([ciA])

    const { result } = renderHook(() => useRwaIssuerCurrencyInfos({ sections }))

    const key = `${MAINNET}-${normalizeTokenAddressForCache(ADDR_A)}`
    expect(result.current.get(key)?.searchMultichainParent).toBeUndefined()
  })

  it('dedupes chain tokens that resolve to the same normalized currencyId before counting', () => {
    const issuerWithDupChain = makeIssuer({
      issuer: 'ondo',
      chainTokens: [
        { chainId: MAINNET, address: ADDR_A },
        { chainId: MAINNET, address: normalizeTokenAddressForCache(ADDR_A) },
      ],
    })
    const rwa = makeRwa({ issuerTokens: [issuerWithDupChain] })
    const sections = [
      makeSection([{ type: OnchainItemListOptionType.RwaCollection, rwa } as unknown as SearchModalOption]),
    ]
    mockUseCurrencyInfos.mockReturnValue([ciA])

    const { result } = renderHook(() => useRwaIssuerCurrencyInfos({ sections }))

    const key = `${MAINNET}-${normalizeTokenAddressForCache(ADDR_A)}`
    expect(result.current.get(key)?.searchMultichainParent).toBeUndefined()
  })
})

describe(getRwaIssuerCurrencyInfo, () => {
  it('returns the resolved CurrencyInfo for an issuer present in the map', () => {
    const map = new Map<string, CurrencyInfo>([[`${MAINNET}-${normalizeTokenAddressForCache(ADDR_A)}`, ciA]])
    expect(getRwaIssuerCurrencyInfo({ issuer: issuerA, enabledChainIds: ENABLED, currencyInfos: map })).toBe(ciA)
  })

  it('returns undefined when the issuer key is absent from the map', () => {
    const map = new Map<string, CurrencyInfo>()
    expect(getRwaIssuerCurrencyInfo({ issuer: issuerA, enabledChainIds: ENABLED, currencyInfos: map })).toBeUndefined()
  })

  it('returns undefined when the issuer has no enabled chain', () => {
    const offChainIssuer = makeIssuer({
      issuer: 'ondo',
      chainTokens: [{ chainId: UniverseChainId.Polygon, address: ADDR_A }],
    })
    const map = new Map<string, CurrencyInfo>([[`${MAINNET}-${normalizeTokenAddressForCache(ADDR_A)}`, ciA]])
    expect(
      getRwaIssuerCurrencyInfo({ issuer: offChainIssuer, enabledChainIds: ENABLED, currencyInfos: map }),
    ).toBeUndefined()
  })
})
