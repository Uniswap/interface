import { GetPortfolioResponse } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { calculateTotalBalancesUsdPerChainRest } from 'uniswap/src/data/balances/utils'

describe('calculateTotalBalancesUsdPerChainRest', () => {
  it('should calculate total balances per chain correctly', () => {
    const mockPortfolioData: GetPortfolioResponse = {
      portfolio: {
        balances: [
          {
            token: { chainId: 8453 },
            valueUsd: 3.304269,
          },
          {
            token: { chainId: 1 },
            valueUsd: 0.024148644,
          },
          {
            token: { chainId: 130 },
            valueUsd: 1.31156,
          },
          {
            token: { chainId: 130 },
            valueUsd: 0.026241,
          },
          {
            token: { chainId: 7777777 },
            valueUsd: 0,
          },
        ],
      },
    } as GetPortfolioResponse

    const result = calculateTotalBalancesUsdPerChainRest(mockPortfolioData)

    expect(result).toEqual({
      BASE: 3.304269,
      ETHEREUM: 0.024148644,
      UNICHAIN: 1.337801, // 1.31156 + 0.026241
      'ZORA NETWORK': 0,
    })
  })

  it('should return undefined when portfolioData is undefined', () => {
    const result = calculateTotalBalancesUsdPerChainRest(undefined)

    expect(result).toBeUndefined()
  })

  it('should return undefined when portfolio is missing', () => {
    const mockPortfolioData = {} as GetPortfolioResponse

    const result = calculateTotalBalancesUsdPerChainRest(mockPortfolioData)

    expect(result).toBeUndefined()
  })

  it('should return undefined when no balances', () => {
    const mockPortfolioData = {
      portfolio: {},
    } as GetPortfolioResponse

    const result = calculateTotalBalancesUsdPerChainRest(mockPortfolioData)

    expect(result).toBeUndefined()
  })
})
