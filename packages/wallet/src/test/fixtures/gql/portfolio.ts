import { Portfolio } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { assetActivity } from 'wallet/src/test/fixtures/gql/activities'
import { amount } from 'wallet/src/test/fixtures/gql/amounts'
import { tokenBalance } from 'wallet/src/test/fixtures/gql/assets'
import { faker } from 'wallet/src/test/shared'
import { createArray, createFixture } from 'wallet/src/test/utils'

type PortfolioOptions = {
  activitiesCount: number
  tokenBalancesCount: number
}

export const portfolio = createFixture<Portfolio, PortfolioOptions>({
  activitiesCount: 2,
  tokenBalancesCount: 2,
})(({ tokenBalancesCount, activitiesCount }) => ({
  __typename: 'Portfolio',
  id: faker.datatype.uuid(),
  ownerAddress: faker.finance.ethereumAddress(),
  // Optional properties based on token balances count
  ...(tokenBalancesCount > 0
    ? {
        tokensTotalDenominatedValue: amount(),
        tokensTotalDenominatedValueChange: {
          id: faker.datatype.uuid(),
          absolute: amount(),
          percentage: amount(),
        },
        tokenBalances: createArray(tokenBalancesCount, tokenBalance),
      }
    : {}),
  // Optional properties based on activitiesCount
  ...(activitiesCount
    ? {
        assetActivities: createArray(activitiesCount, assetActivity),
      }
    : {}),
}))
