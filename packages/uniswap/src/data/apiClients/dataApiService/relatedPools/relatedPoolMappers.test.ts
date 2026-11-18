import type { PlainMessage } from '@bufbuild/protobuf'
import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import type { RankedPool } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { UniverseChainId } from '@universe/chains'
import {
  rankedPoolToCardItem,
  toRelatedPools,
} from 'uniswap/src/data/apiClients/dataApiService/relatedPools/relatedPoolMappers'

function rankedPool(poolId: string, chainId = 1, tvl = 100): PlainMessage<RankedPool> {
  return {
    pool: {
      chainId,
      poolId,
      protocolVersion: ProtocolVersion.V3,
      feeTier: 3000,
      isDynamicFee: false,
      tickSpacing: 60,
      hookAddress: '',
      token0: { address: '0xa', symbol: 'ETH', project: { logoUrl: 'eth.png' } },
      token1: { address: '0xb', symbol: 'USDC', project: { logoUrl: 'usdc.png' } },
      categoryIds: [],
    },
    stats: { tvl },
  } as unknown as PlainMessage<RankedPool>
}

const subject = { chainId: UniverseChainId.Mainnet, poolId: '0xSUBJECT' }

describe('rankedPoolToCardItem', () => {
  it('flattens the legs, version, fee and TVL', () => {
    expect(rankedPoolToCardItem(rankedPool('0x1'))).toMatchObject({
      key: '1-0x1',
      chainId: 1,
      poolId: '0x1',
      token0: { symbol: 'ETH', logoUrl: 'eth.png' },
      token1: { symbol: 'USDC', logoUrl: 'usdc.png' },
      protocolVersion: ProtocolVersion.V3,
      feeTier: 3000,
      tvl: 100,
    })
  })

  it('drops a pool on an unsupported chain', () => {
    expect(rankedPoolToCardItem(rankedPool('0x1', 999999))).toBeUndefined()
  })
})

describe('toRelatedPools', () => {
  it('drops the subject pool case-insensitively and caps the list', () => {
    const pools = [rankedPool('0xsubject'), ...Array.from({ length: 20 }, (_, i) => rankedPool(`0x${i}`))]
    const related = toRelatedPools({ pools, subject })
    expect(related).toHaveLength(16)
    expect(related.some((pool) => pool.poolId === '0xsubject')).toBe(false)
  })

  it('keeps a same-id pool on another chain', () => {
    expect(toRelatedPools({ pools: [rankedPool('0xSUBJECT', UniverseChainId.Base)], subject })).toHaveLength(1)
  })
})
