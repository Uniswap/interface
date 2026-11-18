import { getPortfolioQuery } from 'uniswap/src/data/apiClients/dataApiService/balances/getPortfolio'

const TEST_EVM_ADDRESS_1 = '0x1234567890123456789012345678901234567890'

describe(getPortfolioQuery, () => {
  const input = { evmAddress: TEST_EVM_ADDRESS_1, chainIds: [1] }

  it('subscribes enabled queries and unsubscribes disabled ones by default', () => {
    expect(getPortfolioQuery({ input }).subscribed).toBe(true)
    expect(getPortfolioQuery({ input, enabled: false }).subscribed).toBe(false)
  })

  it('cacheOnly disables fetching but stays subscribed to cached data updates', () => {
    const options = getPortfolioQuery({ input, cacheOnly: true })

    expect(options.enabled).toBe(false)
    expect(options.subscribed).toBe(true)
    expect(options.notifyOnChangeProps).toEqual(['data'])
  })
})
