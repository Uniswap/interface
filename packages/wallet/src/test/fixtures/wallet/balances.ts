import {
  Portfolio,
  Token,
  TokenBalance,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { fromGraphQLChain } from 'wallet/src/features/chains/utils'
import { PortfolioBalance } from 'wallet/src/features/dataApi/types'
import { buildCurrency } from 'wallet/src/features/dataApi/utils'
import { portfolio } from 'wallet/src/test/fixtures/gql'
import { tokenBalance } from 'wallet/src/test/fixtures/gql/assets'
import { currencyInfo } from 'wallet/src/test/fixtures/wallet/currencies'
import { faker } from 'wallet/src/test/shared'
import { createFixture } from 'wallet/src/test/utils'
import { currencyId } from 'wallet/src/utils/currencyId'

const portfolioBalanceBase = createFixture<PortfolioBalance>()(() => ({
  cacheId: faker.datatype.uuid(),
  quantity: faker.datatype.float({ min: 0, max: 1000, precision: 0.01 }),
  balanceUSD: faker.datatype.float({ min: 0, max: 1000, precision: 0.01 }),
  currencyInfo: currencyInfo(),
  relativeChange24: faker.datatype.float({ min: 0, max: 1000, precision: 0.01 }),
  isHidden: faker.datatype.boolean(),
}))

type PortfolioBalanceOptions = {
  fromBalance: RequireNonNullable<TokenBalance, 'quantity' | 'token'> | null
  fromToken: Token | null
}

export const portfolioBalance = createFixture<PortfolioBalance, PortfolioBalanceOptions>({
  fromBalance: null,
  fromToken: null,
})(({ fromBalance, fromToken }) => {
  const balance = fromBalance ?? (fromToken && tokenBalance({ token: fromToken }))
  if (!balance) {
    return portfolioBalanceBase()
  }

  const currency = buildCurrency({
    chainId: fromGraphQLChain(balance.token.chain),
    address: balance.token.address,
    decimals: balance.token.decimals,
    symbol: balance.token.symbol,
    name: balance.token.project?.name,
  })

  if (!currency) {
    return portfolioBalanceBase()
  }

  return {
    cacheId: `${balance.__typename}:${balance.id}`,
    quantity: balance.quantity,
    balanceUSD: balance.denominatedValue?.value,
    isHidden: balance.isHidden,
    // This field is normally calculated dynamically. We cannot mock it in the
    // fixture returned by the mocked resolver as it is ignored and replaced
    // by randomly generated Amount mock. As a result, we expect any number here.
    relativeChange24: expect.any(Number),
    currencyInfo: {
      currency,
      currencyId: currencyId(currency),
      logoUrl: balance.token.project?.logoUrl,
      isSpam: balance.token.project?.isSpam,
      safetyLevel: balance.token.project?.safetyLevel,
    },
  }
})

type PortfolioBalancesOptions = {
  portfolio: Portfolio
}

export const portfolioBalances = createFixture<PortfolioBalance[], PortfolioBalancesOptions>(
  () => ({ portfolio: portfolio() })
)(
  ({ portfolio: { tokenBalances } }) =>
    (tokenBalances
      ?.map((balance) => {
        if (balance?.quantity && balance?.token) {
          return portfolioBalance({
            fromBalance: balance as RequireNonNullable<TokenBalance, 'quantity' | 'token'>,
          })
        }
      })
      .filter(Boolean) as PortfolioBalance[]) ?? []
)
