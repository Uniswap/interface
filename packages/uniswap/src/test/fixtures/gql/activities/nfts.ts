import { GraphQLApi } from '@universe/api'
import { nftAsset } from 'uniswap/src/test/fixtures/gql/assets'
import { faker } from 'uniswap/src/test/shared'
import { createFixture, randomEnumValue } from 'uniswap/src/test/utils'

export const nftApproval = createFixture<GraphQLApi.NftApproval>()(() => ({
  __typename: 'NftApproval',
  id: faker.datatype.uuid(),
  approvedAddress: faker.finance.ethereumAddress(),
  nftStandard: randomEnumValue(GraphQLApi.NftStandard),
  asset: nftAsset(),
}))

export const nftApproveForAll = createFixture<GraphQLApi.NftApproveForAll>()(() => ({
  __typename: 'NftApproveForAll',
  id: faker.datatype.uuid(),
  approved: faker.datatype.boolean(),
  nftStandard: randomEnumValue(GraphQLApi.NftStandard),
  operatorAddress: faker.finance.ethereumAddress(),
  asset: nftAsset(),
}))

export const nftTransfer = createFixture<GraphQLApi.NftTransfer>()(() => ({
  __typename: 'NftTransfer',
  id: faker.datatype.uuid(),
  sender: faker.finance.ethereumAddress(),
  recipient: faker.finance.ethereumAddress(),
  direction: randomEnumValue(GraphQLApi.TransactionDirection),
  nftStandard: randomEnumValue(GraphQLApi.NftStandard),
  asset: nftAsset(),
}))
