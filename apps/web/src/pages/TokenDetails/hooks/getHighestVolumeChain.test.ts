import { GraphQLApi } from '@universe/api'
import type { MultichainTokenEntry } from 'uniswap/src/components/MultichainTokenDetails/useOrderedMultichainEntries'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import type { TokenQueryData } from '~/appGraphql/data/Token'
import { getHighestVolumeChain } from '~/pages/TokenDetails/hooks/getHighestVolumeChain'

type ProjectTokens = NonNullable<NonNullable<NonNullable<TokenQueryData>['project']>['tokens']>

const makeEntry = (chainId: UniverseChainId, address = '0x1'): MultichainTokenEntry => ({
  chainId,
  address,
  isNative: false,
})

const makeToken = (chain: GraphQLApi.Chain, volume?: number): ProjectTokens[number] =>
  ({
    chain,
    address: '0x1',
    market: volume !== undefined ? { volume24H: { value: volume } } : undefined,
  }) as unknown as ProjectTokens[number]

describe('getHighestVolumeChain', () => {
  const entries: MultichainTokenEntry[] = [
    makeEntry(UniverseChainId.Mainnet, '0xeth'),
    makeEntry(UniverseChainId.Base, '0xbase'),
    makeEntry(UniverseChainId.Polygon, '0xpoly'),
  ]

  it('returns the entry with the highest volume', () => {
    const tokens: ProjectTokens = [
      makeToken(GraphQLApi.Chain.Ethereum, 1_000_000),
      makeToken(GraphQLApi.Chain.Base, 5_000_000),
      makeToken(GraphQLApi.Chain.Polygon, 2_000_000),
    ]
    expect(getHighestVolumeChain(tokens, entries)).toEqual(makeEntry(UniverseChainId.Base, '0xbase'))
  })

  it('returns undefined when tokens is undefined', () => {
    expect(getHighestVolumeChain(undefined, entries)).toBeUndefined()
  })

  it('returns undefined when tokens is empty', () => {
    expect(getHighestVolumeChain([], entries)).toBeUndefined()
  })

  it('returns undefined when multichainEntries is empty', () => {
    const tokens: ProjectTokens = [makeToken(GraphQLApi.Chain.Ethereum, 1_000_000)]
    expect(getHighestVolumeChain(tokens, [])).toBeUndefined()
  })

  it('returns undefined when all volumes are zero', () => {
    const tokens: ProjectTokens = [makeToken(GraphQLApi.Chain.Ethereum, 0), makeToken(GraphQLApi.Chain.Base, 0)]
    expect(getHighestVolumeChain(tokens, entries)).toBeUndefined()
  })

  it('returns undefined when no market data exists', () => {
    const tokens: ProjectTokens = [makeToken(GraphQLApi.Chain.Ethereum), makeToken(GraphQLApi.Chain.Base)]
    expect(getHighestVolumeChain(tokens, entries)).toBeUndefined()
  })

  it('ignores tokens without a matching multichain entry', () => {
    const limitedEntries = [makeEntry(UniverseChainId.Base, '0xbase')]
    const tokens: ProjectTokens = [
      makeToken(GraphQLApi.Chain.Ethereum, 10_000_000),
      makeToken(GraphQLApi.Chain.Base, 1_000_000),
    ]
    expect(getHighestVolumeChain(tokens, limitedEntries)).toEqual(makeEntry(UniverseChainId.Base, '0xbase'))
  })
})
