import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { PoolsOrderBy, PoolTokenLogicalOperator } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { UniverseChainId } from '@universe/chains'
import { getMultichainTokenListPoolsParams, getTokenListPoolsParams } from '~/utils/getTokenListPoolsParams'

const ADDRESS_A = '0x1111111111111111111111111111111111111111'
const ADDRESS_B = '0x2222222222222222222222222222222222222222'
// Pinned literal rather than importing DEFAULT_NATIVE_ADDRESS: V4 stores the native leg as the
// zero address (distinct from the legacy 0xEeee… sentinel), and this test exists to catch that
// constant ever drifting off the zero address, which asserting it against itself can't do.
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
// Chains whose native token is a real ERC20 rather than the legacy 0xEeee… placeholder. Pinned as
// literals so a chain-info change that drops these back to a placeholder fails here.
const POL_ADDRESS = '0x0000000000000000000000000000000000001010'
const WPOL_ADDRESS = '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270'
// Celo's native token and its wrapped token are the same contract.
const CELO_ADDRESS = '0x471EcE3750Da237f93B8E339c536989b8978a438'

describe('getTokenListPoolsParams', () => {
  it('builds TVL-sorted single-token params with a checksummed token', () => {
    const params = getTokenListPoolsParams({
      chainId: 1,
      tokenAddress: ADDRESS_A,
      protocolVersions: [ProtocolVersion.V4],
    })

    expect(params).toEqual({
      chainIds: [1],
      sort: { orderBy: PoolsOrderBy.TVL },
      filter: {
        protocolVersions: [ProtocolVersion.V4],
        tokenFilter: { tokens: [ADDRESS_A], logicalOperator: PoolTokenLogicalOperator.OR },
        includeSpam: true,
        applyTopLevelFilters: true,
      },
    })
  })

  it('ORs in the zero address when isNative, covering V4 native pools alongside wrapped-token pools', () => {
    const params = getTokenListPoolsParams({
      chainId: 1,
      tokenAddress: ADDRESS_A,
      isNative: true,
      protocolVersions: [ProtocolVersion.V4],
    })

    expect(params?.filter?.tokenFilter).toEqual({
      tokens: [ADDRESS_A, ZERO_ADDRESS],
      logicalOperator: PoolTokenLogicalOperator.OR,
    })
  })

  it("ORs in Polygon's real native token address rather than the zero address", () => {
    const params = getTokenListPoolsParams({
      chainId: UniverseChainId.Polygon,
      tokenAddress: WPOL_ADDRESS,
      isNative: true,
      protocolVersions: [ProtocolVersion.V4],
    })

    expect(params?.filter?.tokenFilter?.tokens).toEqual([WPOL_ADDRESS, POL_ADDRESS])
  })

  it("ORs in Celo's real native token address, which is also its wrapped address, exactly once", () => {
    const params = getTokenListPoolsParams({
      chainId: UniverseChainId.Celo,
      tokenAddress: CELO_ADDRESS,
      isNative: true,
      protocolVersions: [ProtocolVersion.V4],
    })

    expect(params?.filter?.tokenFilter?.tokens).toEqual([CELO_ADDRESS])
  })

  it('ORs in the zero address on chains that carry the legacy native placeholder (BNB, Avalanche)', () => {
    for (const chainId of [UniverseChainId.Bnb, UniverseChainId.Avalanche]) {
      const params = getTokenListPoolsParams({
        chainId,
        tokenAddress: ADDRESS_A,
        isNative: true,
        protocolVersions: [ProtocolVersion.V4],
      })

      expect(params?.filter?.tokenFilter?.tokens).toEqual([ADDRESS_A, ZERO_ADDRESS])
    }
  })

  it('uses the provided sort when given', () => {
    const params = getTokenListPoolsParams({
      chainId: 1,
      tokenAddress: ADDRESS_A,
      protocolVersions: [],
      sort: { orderBy: PoolsOrderBy.VOLUME_1D, ascending: true },
    })
    expect(params?.sort).toEqual({ orderBy: PoolsOrderBy.VOLUME_1D, ascending: true })
  })

  it('returns undefined when chainId is missing (chainIds is a required field, not an "all chains" wildcard)', () => {
    expect(
      getTokenListPoolsParams({ chainId: undefined, tokenAddress: ADDRESS_A, protocolVersions: [] }),
    ).toBeUndefined()
  })

  it('returns undefined when tokenAddress is missing (never an unfiltered chain-wide query)', () => {
    expect(getTokenListPoolsParams({ chainId: 1, tokenAddress: undefined, protocolVersions: [] })).toBeUndefined()
  })
})

describe('getMultichainTokenListPoolsParams', () => {
  it('combines every deployment into a single request with all chainIds and all addresses', () => {
    const request = getMultichainTokenListPoolsParams({
      entries: [
        { chainId: UniverseChainId.Mainnet, address: ADDRESS_A, isNative: false },
        { chainId: UniverseChainId.Base, address: ADDRESS_B, isNative: false },
      ],
      protocolVersions: [ProtocolVersion.V4],
    })

    expect(request?.params).toEqual({
      chainIds: [UniverseChainId.Mainnet, UniverseChainId.Base],
      sort: { orderBy: PoolsOrderBy.TVL },
      filter: {
        protocolVersions: [ProtocolVersion.V4],
        tokenFilter: { tokens: [ADDRESS_A, ADDRESS_B], logicalOperator: PoolTokenLogicalOperator.OR },
        includeSpam: true,
        applyTopLevelFilters: true,
      },
    })
  })

  it('dedups an address shared across chains (e.g. CREATE2 same-address deployments)', () => {
    const request = getMultichainTokenListPoolsParams({
      entries: [
        { chainId: UniverseChainId.Optimism, address: ADDRESS_A, isNative: false },
        { chainId: UniverseChainId.Base, address: ADDRESS_A, isNative: false },
      ],
      protocolVersions: [],
    })

    expect(request?.params.chainIds).toEqual([UniverseChainId.Optimism, UniverseChainId.Base])
    expect(request?.params.filter?.tokenFilter?.tokens).toEqual([ADDRESS_A])
  })

  it('resolves a native entry to its wrapped address and ORs in the zero address once', () => {
    const request = getMultichainTokenListPoolsParams({
      entries: [
        // The native sentinel is not what V2/V3 pools pair against — the wrapped address is.
        { chainId: UniverseChainId.Mainnet, address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', isNative: true },
        { chainId: UniverseChainId.Base, address: ADDRESS_B, isNative: false },
      ],
      protocolVersions: [],
    })

    // Checksummed mainnet WETH — getWrappedNativeAddress returns it lowercased, the builder
    // checksums it (the API expects checksummed EVM addresses).
    expect(request?.params.filter?.tokenFilter?.tokens).toEqual([
      '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
      ADDRESS_B,
      ZERO_ADDRESS,
    ])
  })

  it("ORs in each native chain's own native address, not a single zero address", () => {
    const request = getMultichainTokenListPoolsParams({
      entries: [
        // POL and CELO are real ERC20 contracts, unlike the 0xEeee… placeholder most chains carry.
        { chainId: UniverseChainId.Polygon, address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', isNative: true },
        { chainId: UniverseChainId.Celo, address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', isNative: true },
        { chainId: UniverseChainId.Mainnet, address: ADDRESS_A, isNative: false },
      ],
      protocolVersions: [],
    })

    // Wrapped addresses first, then the native legs; CELO is already present as Celo's wrapped
    // address, so it isn't repeated, and no zero address is requested for these chains.
    expect(request?.params.filter?.tokenFilter?.tokens).toEqual([WPOL_ADDRESS, CELO_ADDRESS, ADDRESS_A, POL_ADDRESS])
    expect(request?.allowedAddressesByChain.get(UniverseChainId.Polygon)).toEqual(
      new Set([WPOL_ADDRESS.toLowerCase(), POL_ADDRESS, ZERO_ADDRESS]),
    )
    expect(request?.allowedAddressesByChain.get(UniverseChainId.Celo)).toEqual(
      new Set([CELO_ADDRESS.toLowerCase(), ZERO_ADDRESS]),
    )
    expect(request?.allowedAddressesByChain.get(UniverseChainId.Mainnet)).toEqual(new Set([ADDRESS_A]))
  })

  it('builds the post-filter allowlist in the same pass, scoping the zero address to native chains only', () => {
    const request = getMultichainTokenListPoolsParams({
      entries: [
        { chainId: UniverseChainId.Mainnet, address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', isNative: true },
        { chainId: UniverseChainId.Base, address: ADDRESS_B, isNative: false },
      ],
      protocolVersions: [],
    })

    expect(request?.allowedAddressesByChain).toEqual(
      new Map([
        // Allowlist entries are cache-normalized (lowercased), unlike the checksummed request tokens.
        [UniverseChainId.Mainnet, new Set(['0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', ZERO_ADDRESS])],
        [UniverseChainId.Base, new Set([ADDRESS_B])],
      ]),
    )
  })

  it('returns undefined when no entry resolves to an address (never an unfiltered chain-wide query)', () => {
    expect(getMultichainTokenListPoolsParams({ entries: [], protocolVersions: [] })).toBeUndefined()
  })
})
