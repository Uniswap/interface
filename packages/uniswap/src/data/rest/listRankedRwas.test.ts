import { PartialMessage } from '@bufbuild/protobuf'
import { useQuery } from '@connectrpc/connect-query'
import { RankedRwa, RwaCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { OnchainItemListOptionType } from 'uniswap/src/components/lists/items/types'
import { buildRwaTokenOption, useListRankedRwasQuery } from 'uniswap/src/data/rest/listRankedRwas'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { renderHook } from 'uniswap/src/test/test-utils'

const { mockUseEnabledChains, mockUseFeatureFlag } = vi.hoisted(() => ({
  mockUseEnabledChains: vi.fn(),
  mockUseFeatureFlag: vi.fn(),
}))

vi.mock('@connectrpc/connect-query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@connectrpc/connect-query')>()),
  useQuery: vi.fn(),
}))

vi.mock('uniswap/src/features/chains/hooks/useEnabledChains', () => ({
  useEnabledChains: mockUseEnabledChains,
}))

vi.mock('@universe/gating', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/gating')>()),
  useFeatureFlag: mockUseFeatureFlag,
}))

const mockUseQuery = vi.mocked(useQuery)
const CHAIN_IDS = [UniverseChainId.Mainnet, UniverseChainId.Base]

function makeRwa(overrides?: PartialMessage<RankedRwa>): RankedRwa {
  return new RankedRwa({
    symbol: 'GOOGL',
    name: 'Alphabet',
    logoUrl: 'https://example.com/googl.png',
    issuerTokens: [
      {
        symbol: 'GOOGLX',
        name: 'Alphabet xStock',
        logoUrl: 'https://example.com/googlx.png',
        issuer: 'xstock',
        chainTokens: [{ chainId: UniverseChainId.Bnb, address: '0xe92f673ca36c5e2efd2de7628f815f84807e803f' }],
      },
    ],
    ...overrides,
  })
}

describe(useListRankedRwasQuery, () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseEnabledChains.mockReturnValue({ chains: CHAIN_IDS })
    mockUseFeatureFlag.mockReturnValue(false)
    mockUseQuery.mockReturnValue({ data: undefined } as unknown as ReturnType<typeof useQuery>)
  })

  it('sets useSubstreamData to false when V2EndpointsTokens is disabled', () => {
    mockUseFeatureFlag.mockReturnValue(false)

    renderHook(() =>
      useListRankedRwasQuery({ category: RwaCategory.STOCKS, chainIds: CHAIN_IDS, includeSparkline1d: false }),
    )

    expect(mockUseQuery.mock.calls[0]?.[1]).toEqual(expect.objectContaining({ useSubstreamData: false }))
  })

  it('sets useSubstreamData to true when V2EndpointsTokens is enabled', () => {
    mockUseFeatureFlag.mockReturnValue(true)

    renderHook(() =>
      useListRankedRwasQuery({ category: RwaCategory.STOCKS, chainIds: CHAIN_IDS, includeSparkline1d: false }),
    )

    expect(mockUseQuery.mock.calls[0]?.[1]).toEqual(expect.objectContaining({ useSubstreamData: true }))
  })
})

describe('buildRwaTokenOption', () => {
  it('maps issuerTokens[0].chainTokens[0] with issuer-token metadata, no decimals', () => {
    const option = buildRwaTokenOption(makeRwa())
    expect(option).toEqual({
      type: OnchainItemListOptionType.Rwa,
      chainId: UniverseChainId.Bnb,
      address: '0xe92f673ca36c5e2efd2de7628f815f84807e803f',
      symbol: 'GOOGLX',
      name: 'Alphabet xStock',
      logoUrl: 'https://example.com/googlx.png',
    })
    expect(option).not.toHaveProperty('decimals')
  })

  it('keeps Solana (SVM) tokens without mutating the base58 address', () => {
    const solanaAddress = 'FovBwhoV5KQjZCdhoM6jgXYwXLX3F8vgAfvmLH7ondo'
    const option = buildRwaTokenOption(
      makeRwa({
        issuerTokens: [
          {
            symbol: 'MRVLON',
            name: 'Marvell',
            chainTokens: [{ chainId: UniverseChainId.Solana, address: solanaAddress }],
          },
        ],
      }),
    )
    expect(option?.chainId).toBe(UniverseChainId.Solana)
    expect(option?.address).toBe(solanaAddress)
  })

  it('returns null for an unsupported chainId', () => {
    const option = buildRwaTokenOption(
      makeRwa({ issuerTokens: [{ symbol: 'X', name: 'X', chainTokens: [{ chainId: 999999, address: '0xabc' }] }] }),
    )
    expect(option).toBeNull()
  })

  it('falls back to rwa.logoUrl when the issuer token logo is empty', () => {
    const option = buildRwaTokenOption(
      makeRwa({
        logoUrl: 'https://example.com/rwa.png',
        issuerTokens: [
          {
            symbol: 'GOOGLX',
            name: 'A',
            logoUrl: '',
            chainTokens: [{ chainId: UniverseChainId.Bnb, address: '0xabc' }],
          },
        ],
      }),
    )
    expect(option?.logoUrl).toBe('https://example.com/rwa.png')
  })
})
