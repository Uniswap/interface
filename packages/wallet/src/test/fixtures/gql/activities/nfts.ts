import {
  NftApproval,
  NftApproveForAll,
  NftStandard,
  NftTransfer,
  TransactionDirection,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { nftAsset } from 'wallet/src/test/fixtures/gql/assets'
import { faker } from 'wallet/src/test/shared'
import { createFixture, randomEnumValue } from 'wallet/src/test/utils'

export const nftApproval = createFixture<NftApproval>()(() => ({
  __typename: 'NftApproval',
  id: faker.datatype.uuid(),
  approvedAddress: faker.finance.ethereumAddress(),
  nftStandard: randomEnumValue(NftStandard),
  asset: nftAsset(),
}))

export const nftApproveForAll = createFixture<NftApproveForAll>()(() => ({
  __typename: 'NftApproveForAll',
  id: faker.datatype.uuid(),
  approved: faker.datatype.boolean(),
  nftStandard: randomEnumValue(NftStandard),
  operatorAddress: faker.finance.ethereumAddress(),
  asset: nftAsset(),
}))

export const nftTransfer = createFixture<NftTransfer>()(() => ({
  __typename: 'NftTransfer',
  id: faker.datatype.uuid(),
  sender: faker.finance.ethereumAddress(),
  recipient: faker.finance.ethereumAddress(),
  direction: randomEnumValue(TransactionDirection),
  nftStandard: randomEnumValue(NftStandard),
  asset: nftAsset(),
}))
