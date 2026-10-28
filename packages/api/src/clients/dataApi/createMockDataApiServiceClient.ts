import type { DataApiServiceClient } from '@universe/api/src/clients/dataApi/createDataApiServiceClient'

const notMocked = (method: string) => (): Promise<never> =>
  Promise.reject(new Error(`DataApiServiceClient.${method} was called but not mocked`))

/**
 * Test double for the full `DataApiServiceClient` surface. Every method rejects unless
 * overridden, so a test only stubs the calls it actually exercises.
 */
export function createMockDataApiServiceClient(overrides: Partial<DataApiServiceClient> = {}): DataApiServiceClient {
  return {
    getPortfolio: notMocked('getPortfolio'),
    getPortfolioChart: notMocked('getPortfolioChart'),
    listTransactions: notMocked('listTransactions'),
    getWalletBalances: notMocked('getWalletBalances'),
    getWalletsBalances: notMocked('getWalletsBalances'),
    getWalletProfitLoss: notMocked('getWalletProfitLoss'),
    getWalletTokenProfitLoss: notMocked('getWalletTokenProfitLoss'),
    getWalletTokensProfitLoss: notMocked('getWalletTokensProfitLoss'),
    submitReport: notMocked('submitReport'),
    submitDataReport: notMocked('submitDataReport'),
    ...overrides,
  }
}
