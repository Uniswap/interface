import type { PlainMessage } from '@bufbuild/protobuf'
import type { Token } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { PortfolioBalance } from 'uniswap/src/features/dataApi/types'
import { restV2TokenToCurrencyInfo } from 'uniswap/src/features/dataApi/utils/restV2TokenToCurrencyInfo'
import { restV2Token } from 'uniswap/src/test/fixtures/dataApi/tokens'
import { currencyInfo } from 'uniswap/src/test/fixtures/wallet/currencies'
import { faker } from 'uniswap/src/test/shared'
import { createArray, createFixture } from 'uniswap/src/test/utils'

const portfolioBalanceBase = createFixture<PortfolioBalance>()(() => ({
  id: faker.datatype.uuid(),
  cacheId: faker.datatype.uuid(),
  quantity: faker.datatype.float({ min: 0, max: 1000, precision: 0.01 }),
  balanceUSD: faker.datatype.float({ min: 0, max: 1000, precision: 0.01 }),
  currencyInfo: currencyInfo(),
  relativeChange24: faker.datatype.float({ min: 0, max: 1000, precision: 0.01 }),
  isHidden: faker.datatype.boolean(),
}))

type PortfolioBalanceOptions = {
  fromToken: PlainMessage<Token> | null
}

/**
 * A `PortfolioBalance` for a v2 REST token. The currency is derived with the same
 * `restV2TokenToCurrencyInfo` the app uses, so a balance and a mocked token query built from the
 * same fixture agree on `currencyId` — which is what the token-list hooks join on.
 *
 * Amounts are randomized per call, so a test that needs the balance in both its input and its
 * expected output should build it once and reuse it rather than calling this twice.
 */
export const portfolioBalance = createFixture<PortfolioBalance, PortfolioBalanceOptions>({
  fromToken: null,
})(({ fromToken }) => {
  const tokenCurrencyInfo = fromToken && restV2TokenToCurrencyInfo(fromToken)
  if (!tokenCurrencyInfo) {
    return portfolioBalanceBase()
  }

  const id = faker.datatype.uuid()
  return {
    ...portfolioBalanceBase({ id, cacheId: `TokenBalance:${id}` }),
    currencyInfo: tokenCurrencyInfo,
    isHidden: false,
  }
})

type PortfolioBalancesOptions = {
  balancesCount: number
}

export const portfolioBalances = createFixture<PortfolioBalance[], PortfolioBalancesOptions>({
  balancesCount: 2,
})(({ balancesCount }) => createArray(balancesCount, () => portfolioBalance({ fromToken: restV2Token() })))
