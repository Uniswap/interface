import { TokenRankingsStat } from '@uniswap/client-explore/dist/uniswap/explore/v1/service_pb'
import { tokenRankingsStatToMarketData } from 'uniswap/src/data/apiClients/dataApiService/exploreV1/tokenRankings'

describe('tokenRankingsStatToMarketData', () => {
  it('maps price, 24h change, and network count through', () => {
    const stat = new TokenRankingsStat({
      price: { value: 1234.56 },
      pricePercentChange1Day: { value: -3.21 },
      chainTokens: [{}, {}, {}],
    })

    expect(tokenRankingsStatToMarketData(stat)).toEqual({
      priceUsd: 1234.56,
      pricePercentChange24h: -3.21,
      networkCount: 3,
    })
  })

  it('returns undefined fields when price data is missing', () => {
    const stat = new TokenRankingsStat({ chainTokens: [{}, {}] })

    expect(tokenRankingsStatToMarketData(stat)).toEqual({
      priceUsd: undefined,
      pricePercentChange24h: undefined,
      networkCount: 2,
    })
  })

  it('omits networkCount for single-chain tokens', () => {
    const singleChain = new TokenRankingsStat({ price: { value: 1 }, chainTokens: [{}] })
    const noChains = new TokenRankingsStat({ price: { value: 1 } })

    expect(tokenRankingsStatToMarketData(singleChain).networkCount).toBeUndefined()
    expect(tokenRankingsStatToMarketData(noChains).networkCount).toBeUndefined()
  })
})
