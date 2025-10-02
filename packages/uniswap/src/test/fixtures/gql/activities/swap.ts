import { GraphQLApi } from '@universe/api'
import { daiToken, ethToken } from 'uniswap/src/test/fixtures/gql/assets'
import { faker } from 'uniswap/src/test/shared'
import { createFixture, randomEnumValue } from 'uniswap/src/test/utils'

export const swapOrderDetails = createFixture<GraphQLApi.SwapOrderDetails>()(() => ({
  __typename: 'SwapOrderDetails',
  id: faker.datatype.uuid(),
  hash: faker.datatype.uuid(),
  expiry: faker.date.future().getTime(),
  inputToken: ethToken(),
  inputTokenQuantity: faker.datatype.float({ min: 0, max: 1000, precision: 0.01 }).toString(),
  offerer: faker.finance.ethereumAddress(),
  outputToken: daiToken(),
  outputTokenQuantity: faker.datatype.float({ min: 0, max: 1000, precision: 0.01 }).toString(),
  /** @deprecated use swapOrderStatus to disambiguate from transactionStatus */
  status: randomEnumValue(GraphQLApi.SwapOrderStatus),
  swapOrderStatus: randomEnumValue(GraphQLApi.SwapOrderStatus),
  encodedOrder: faker.datatype.string(),
  swapOrderType: GraphQLApi.SwapOrderType.Dutch,
}))
