import {
  ActivityType,
  AssetActivity,
  AssetChange,
  Chain,
  TransactionStatus,
  TransactionType,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import {
  erc20ApproveAssetChange,
  erc20TransferIn,
} from 'wallet/src/test/fixtures/gql/activities/tokens'
import { GQL_CHAINS } from 'wallet/src/test/fixtures/gql/misc'
import { gqlTransaction, gqlTransactionDetails } from 'wallet/src/test/fixtures/gql/transactions'
import { MAX_FIXTURE_TIMESTAMP, faker } from 'wallet/src/test/shared'
import { createFixture, randomChoice, randomEnumValue } from 'wallet/src/test/utils'
import { erc20TokenTransferOut } from './tokens'
export * from './nfts'
export * from './swap'
export * from './tokens'

/**
 * Base fixtures
 */

export const assetActivity = createFixture<AssetActivity>()(() => ({
  id: faker.datatype.uuid(),
  chain: randomChoice(GQL_CHAINS),
  /** @deprecated use assetChanges field in details */
  assetChanges: [] as AssetChange[],
  details: gqlTransactionDetails(),
  timestamp: faker.datatype.number({ max: MAX_FIXTURE_TIMESTAMP }),
  /** @deprecated use type field in details */
  transaction: gqlTransaction(),
  /** @deprecated use type field in details */
  type: randomEnumValue(ActivityType),
}))

/**
 * Derived fixtures
 */

export const approveAssetActivity = createFixture<AssetActivity>()(() =>
  assetActivity({
    chain: Chain.Ethereum,
    /** @deprecated use type field in details */
    type: ActivityType.Approve,
    details: gqlTransactionDetails({
      type: TransactionType.Approve,
      transactionStatus: TransactionStatus.Confirmed,
      assetChanges: [erc20ApproveAssetChange()],
    }),
  })
)

export const erc20SwapAssetActivity = createFixture<AssetActivity>()(() =>
  assetActivity({
    chain: Chain.Ethereum,
    /** @deprecated use type field in details */
    type: ActivityType.Swap,
    details: gqlTransactionDetails({
      type: TransactionType.Swap,
      transactionStatus: TransactionStatus.Confirmed,
      assetChanges: [erc20TransferIn(), erc20TokenTransferOut()],
    }),
  })
)

export const erc20ReceiveAssetActivity = createFixture<AssetActivity>()(() =>
  assetActivity({
    chain: Chain.Ethereum,
    /** @deprecated use type field in details */
    type: ActivityType.Receive,
    details: gqlTransactionDetails({
      type: TransactionType.Receive,
      transactionStatus: TransactionStatus.Confirmed,
      assetChanges: [erc20TransferIn()],
    }),
  })
)
