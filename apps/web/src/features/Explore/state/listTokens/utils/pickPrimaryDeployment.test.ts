import { ChainTokenRankStats, TokenRankStats } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { describe, expect, it } from 'vitest'
import { pickPrimaryDeployment } from '~/features/Explore/state/listTokens/utils/pickPrimaryDeployment'

describe('pickPrimaryDeployment', () => {
  it('returns undefined when addresses is empty', () => {
    expect(pickPrimaryDeployment({ addresses: {}, exploreChainId: undefined })).toBeUndefined()
  })

  it('matches exploreChainId when set, regardless of volume', () => {
    const addresses = { '1': '0xEth', '8453': '0xBase' }
    const chainStats = [
      new ChainTokenRankStats({ chainId: 1, stats: new TokenRankStats({ volume1d: 100 }) }),
      new ChainTokenRankStats({ chainId: 8453, stats: new TokenRankStats({ volume1d: 999 }) }),
    ]
    expect(pickPrimaryDeployment({ addresses, exploreChainId: UniverseChainId.Base, chainStats })).toEqual({
      chainId: 8453,
      address: '0xBase',
    })
  })

  it('returns undefined when exploreChainId has no matching address', () => {
    expect(pickPrimaryDeployment({ addresses: { '1': '0xEth' }, exploreChainId: UniverseChainId.Base })).toBeUndefined()
  })

  it('picks the deployment with the most 1d volume when exploreChainId is undefined', () => {
    const addresses = { '1': '0xEth', '8453': '0xBase', '10': '0xOptimism' }
    const chainStats = [
      new ChainTokenRankStats({ chainId: 1, stats: new TokenRankStats({ volume1d: 100 }) }),
      new ChainTokenRankStats({ chainId: 8453, stats: new TokenRankStats({ volume1d: 999 }) }),
      new ChainTokenRankStats({ chainId: 10, stats: new TokenRankStats({ volume1d: 500 }) }),
    ]
    expect(pickPrimaryDeployment({ addresses, exploreChainId: undefined, chainStats })).toEqual({
      chainId: 8453,
      address: '0xBase',
    })
  })

  it('falls back to the first addresses entry when chainStats is empty', () => {
    const addresses = { '8453': '0xBase', '1': '0xEth' }
    expect(pickPrimaryDeployment({ addresses, exploreChainId: undefined, chainStats: [] })).toEqual({
      chainId: 1,
      address: '0xEth',
    })
  })

  it('falls back to the first addresses entry when no chainStats entry has a matching address', () => {
    const addresses = { '1': '0xEth' }
    const chainStats = [new ChainTokenRankStats({ chainId: 8453, stats: new TokenRankStats({ volume1d: 999 }) })]
    expect(pickPrimaryDeployment({ addresses, exploreChainId: undefined, chainStats })).toEqual({
      chainId: 1,
      address: '0xEth',
    })
  })

  it('defaults to the first addresses entry when chainStats is omitted', () => {
    expect(pickPrimaryDeployment({ addresses: { '8453': '0xBase', '1': '0xEth' }, exploreChainId: undefined })).toEqual(
      {
        chainId: 1,
        address: '0xEth',
      },
    )
  })
})
