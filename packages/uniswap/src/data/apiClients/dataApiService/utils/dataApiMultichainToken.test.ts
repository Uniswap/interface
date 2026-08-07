import { ChainTokenRankStats, TokenRankStats } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import {
  dataApiMultichainTokenToSearchResult,
  pickPrimaryDeployment,
} from 'uniswap/src/data/apiClients/dataApiService/utils/dataApiMultichainToken'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { createRankedMultichainToken } from 'uniswap/src/test/fixtures/dataApi/rankedMultichainToken'

describe('dataApiMultichainTokenToSearchResult', () => {
  it('should convert a RankedMultichainToken with multiple chains', () => {
    const token = createRankedMultichainToken({
      addresses: {
        '1': '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        '137': '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
      },
    })

    const result = dataApiMultichainTokenToSearchResult(token)

    expect(result).toBeDefined()
    expect(result?.id).toBe('mc:1_0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48')
    expect(result?.name).toBe('USD Coin')
    expect(result?.symbol).toBe('USDC')
    expect(result?.logoUrl).toBe('https://example.com/usdc.png')
    expect(result?.tokens).toHaveLength(2)
    expect(result?.tokens.map((t) => t.currency.chainId).sort()).toEqual([1, 137])
  })

  it('should return undefined when multichainToken is missing', () => {
    const token = createRankedMultichainToken()
    token.multichainToken = undefined

    expect(dataApiMultichainTokenToSearchResult(token)).toBeUndefined()
  })

  it('should return undefined when addresses is empty', () => {
    const token = createRankedMultichainToken({ addresses: {} })

    expect(dataApiMultichainTokenToSearchResult(token)).toBeUndefined()
  })

  it('should return undefined when all chain addresses fail currency construction', () => {
    const token = createRankedMultichainToken({ addresses: { '0': '' } })

    expect(dataApiMultichainTokenToSearchResult(token)).toBeUndefined()
  })

  it('should skip invalid chain addresses but keep valid ones', () => {
    const token = createRankedMultichainToken({
      addresses: { '0': '', '1': '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' },
    })

    const result = dataApiMultichainTokenToSearchResult(token)

    expect(result?.tokens).toHaveLength(1)
    expect(result?.tokens[0]?.currency.chainId).toBe(1)
  })

  it('should handle ETH native token', () => {
    const token = createRankedMultichainToken({
      symbol: 'ETH',
      name: 'Ethereum',
      decimals: 18,
      addresses: { '1': 'ETH' },
    })

    const result = dataApiMultichainTokenToSearchResult(token)

    expect(result?.tokens).toHaveLength(1)
    expect(result?.tokens[0]?.currency.isNative).toBe(true)
  })

  it('should populate parent-level safetyInfo from v2 TokenSafety', () => {
    const token = createRankedMultichainToken({ isVerified: true })

    const result = dataApiMultichainTokenToSearchResult(token)

    expect(result?.safetyInfo).toBeDefined()
    expect(result?.safetyInfo?.tokenList).toBeDefined()
  })

  it('should use shared project logoUrl on each CurrencyInfo', () => {
    const token = createRankedMultichainToken({ logoUrl: 'https://example.com/token.png' })

    const result = dataApiMultichainTokenToSearchResult(token)

    expect(result?.tokens[0]?.logoUrl).toBe('https://example.com/token.png')
  })

  it('should propagate isSpam onto each CurrencyInfo from the parent TokenSafety', () => {
    const token = createRankedMultichainToken({ isSpam: true })

    const result = dataApiMultichainTokenToSearchResult(token)

    expect(result?.tokens[0]?.isSpam).toBe(true)
  })
})

describe('pickPrimaryDeployment', () => {
  it('returns undefined when addresses is empty', () => {
    expect(pickPrimaryDeployment({ addresses: {}, chainId: undefined })).toBeUndefined()
  })

  it('matches chainId when set, regardless of volume', () => {
    const addresses = { '1': '0xEth', '8453': '0xBase' }
    const chainStats = [
      new ChainTokenRankStats({ chainId: 1, stats: new TokenRankStats({ volume1d: 100 }) }),
      new ChainTokenRankStats({ chainId: 8453, stats: new TokenRankStats({ volume1d: 999 }) }),
    ]
    expect(pickPrimaryDeployment({ addresses, chainId: UniverseChainId.Base, chainStats })).toEqual({
      chainId: 8453,
      address: '0xBase',
    })
  })

  it('returns undefined when chainId has no matching address', () => {
    expect(pickPrimaryDeployment({ addresses: { '1': '0xEth' }, chainId: UniverseChainId.Base })).toBeUndefined()
  })

  it('picks the deployment with the most 1d volume when chainId is undefined', () => {
    const addresses = { '1': '0xEth', '8453': '0xBase', '10': '0xOptimism' }
    const chainStats = [
      new ChainTokenRankStats({ chainId: 1, stats: new TokenRankStats({ volume1d: 100 }) }),
      new ChainTokenRankStats({ chainId: 8453, stats: new TokenRankStats({ volume1d: 999 }) }),
      new ChainTokenRankStats({ chainId: 10, stats: new TokenRankStats({ volume1d: 500 }) }),
    ]
    expect(pickPrimaryDeployment({ addresses, chainId: undefined, chainStats })).toEqual({
      chainId: 8453,
      address: '0xBase',
    })
  })

  it('falls back to the first addresses entry when chainStats is empty', () => {
    const addresses = { '8453': '0xBase', '1': '0xEth' }
    expect(pickPrimaryDeployment({ addresses, chainId: undefined, chainStats: [] })).toEqual({
      chainId: 1,
      address: '0xEth',
    })
  })

  it('falls back to the first addresses entry when no chainStats entry has a matching address', () => {
    const addresses = { '1': '0xEth' }
    const chainStats = [new ChainTokenRankStats({ chainId: 8453, stats: new TokenRankStats({ volume1d: 999 }) })]
    expect(pickPrimaryDeployment({ addresses, chainId: undefined, chainStats })).toEqual({
      chainId: 1,
      address: '0xEth',
    })
  })

  it('defaults to the first addresses entry when chainStats is omitted', () => {
    expect(pickPrimaryDeployment({ addresses: { '8453': '0xBase', '1': '0xEth' }, chainId: undefined })).toEqual({
      chainId: 1,
      address: '0xEth',
    })
  })
})
