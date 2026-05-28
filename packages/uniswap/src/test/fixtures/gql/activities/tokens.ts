import { GraphQLApi } from '@universe/api'
import { amount } from 'uniswap/src/test/fixtures/gql/amounts'
import { daiToken, ethToken } from 'uniswap/src/test/fixtures/gql/assets'
import { faker } from 'uniswap/src/test/shared'
import { createFixture, randomEnumValue } from 'uniswap/src/test/utils'

/**
 * Base fixtures
 */

export const tokenApproval = createFixture<GraphQLApi.TokenApproval>()(() => ({
  __typename: 'TokenApproval',
  id: faker.datatype.uuid(),
  approvedAddress: faker.finance.ethereumAddress(),
  quantity: faker.datatype.float({ min: 0, max: 1000, precision: 0.01 }).toString(),
  asset: ethToken(),
  tokenStandard: randomEnumValue(GraphQLApi.TokenStandard),
}))

export const tokenTransfer = createFixture<GraphQLApi.TokenTransfer>()(() => ({
  __typename: 'TokenTransfer',
  id: faker.datatype.uuid(),
  asset: ethToken(),
  direction: randomEnumValue(GraphQLApi.TransactionDirection),
  quantity: faker.datatype.float({ min: 0, max: 1000, precision: 0.01 }).toString(),
  recipient: faker.finance.ethereumAddress(),
  sender: faker.finance.ethereumAddress(),
  tokenStandard: randomEnumValue(GraphQLApi.TokenStandard),
}))

/**
 * Derived fixtures
 */

export const erc20ApproveAssetChange = createFixture<GraphQLApi.TokenApproval>()(() =>
  tokenApproval({ asset: daiToken(), tokenStandard: GraphQLApi.TokenStandard.Erc20 }),
)

export const erc20TokenTransferOut = createFixture<GraphQLApi.TokenTransfer>()(() =>
  tokenTransfer({
    asset: daiToken(),
    tokenStandard: GraphQLApi.TokenStandard.Erc20,
    direction: GraphQLApi.TransactionDirection.Out,
    transactedValue: amount({ value: 1, currency: GraphQLApi.Currency.Usd }),
  }),
)

export const erc20TransferIn = createFixture<GraphQLApi.TokenTransfer>()(() =>
  erc20TokenTransferOut({ direction: GraphQLApi.TransactionDirection.In }),
)
