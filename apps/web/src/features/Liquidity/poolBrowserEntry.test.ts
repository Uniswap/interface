import { UniverseChainId } from '@universe/chains'
import { describe, expect, it } from 'vitest'
import { getPoolBrowserPdpUrl } from '~/features/Liquidity/poolBrowserEntry'

describe('getPoolBrowserPdpUrl', () => {
  it('opens the pool details with the range editor', () => {
    expect(getPoolBrowserPdpUrl({ poolIdOrHash: '0xabc', chainId: UniverseChainId.Base })).toBe(
      '/explore/pools/base/0xabc?deposit=range',
    )
  })
})
