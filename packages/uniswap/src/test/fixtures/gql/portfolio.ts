import { GraphQLApi } from '@universe/api'
import { assetActivity } from 'uniswap/src/test/fixtures/gql'
import { amount } from 'uniswap/src/test/fixtures/gql/amounts'
import { tokenBalance } from 'uniswap/src/test/fixtures/gql/assets'
import { faker } from 'uniswap/src/test/shared'
import { createArray, createFixture } from 'uniswap/src/test/utils'

type PortfolioOptions = {
  activitiesCount: number
  tokenBalancesCount: number
}

export const portfolio = createFixture<GraphQLApi.Portfolio, PortfolioOptions>({
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
