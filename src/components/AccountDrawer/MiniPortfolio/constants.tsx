import { i18n } from '@lingui/core'
import { msg } from '@lingui/macro'
import { SwapOrderStatus, TransactionStatus } from 'graphql/data/__generated__/types-and-hooks'
import { UniswapXOrderStatus } from 'lib/hooks/orders/types'
import { TransactionType } from 'state/transactions/types'

// use even number because rows are in groups of 2
export const DEFAULT_NFT_QUERY_AMOUNT = 26

const TransactionTitleTable: { [key in TransactionType]: { [state in TransactionStatus]: string } } = {
  [TransactionType.SWAP]: {
    [TransactionStatus.Pending]: i18n._(msg`Swapping`),
    [TransactionStatus.Confirmed]: i18n._(msg`Swapped`),
    [TransactionStatus.Failed]: i18n._(msg`Swap failed`),
  },
  [TransactionType.WRAP]: {
    [TransactionStatus.Pending]: i18n._(msg`Wrapping`),
    [TransactionStatus.Confirmed]: i18n._(msg`Wrapped`),
    [TransactionStatus.Failed]: i18n._(msg`Wrap failed`),
  },
  [TransactionType.ADD_LIQUIDITY_V3_POOL]: {
    [TransactionStatus.Pending]: i18n._(msg`Adding liquidity`),
    [TransactionStatus.Confirmed]: i18n._(msg`Added liquidity`),
    [TransactionStatus.Failed]: i18n._(msg`Add liquidity failed`),
  },
  [TransactionType.REMOVE_LIQUIDITY_V3]: {
    [TransactionStatus.Pending]: i18n._(msg`Removing liquidity`),
    [TransactionStatus.Confirmed]: i18n._(msg`Removed liquidity`),
    [TransactionStatus.Failed]: i18n._(msg`Remove liquidity failed`),
  },
  [TransactionType.CREATE_V3_POOL]: {
    [TransactionStatus.Pending]: i18n._(msg`Creating pool`),
    [TransactionStatus.Confirmed]: i18n._(msg`Created pool`),
    [TransactionStatus.Failed]: i18n._(msg`Create pool failed`),
  },
  [TransactionType.COLLECT_FEES]: {
    [TransactionStatus.Pending]: i18n._(msg`Collecting fees`),
    [TransactionStatus.Confirmed]: i18n._(msg`Collected fees`),
    [TransactionStatus.Failed]: i18n._(msg`Collect fees failed`),
  },
  [TransactionType.APPROVAL]: {
    [TransactionStatus.Pending]: i18n._(msg`Approving`),
    [TransactionStatus.Confirmed]: i18n._(msg`Approved`),
    [TransactionStatus.Failed]: i18n._(msg`Approval failed`),
  },
  [TransactionType.CLAIM]: {
    [TransactionStatus.Pending]: i18n._(msg`Claiming`),
    [TransactionStatus.Confirmed]: i18n._(msg`Claimed`),
    [TransactionStatus.Failed]: i18n._(msg`Claim failed`),
  },
  [TransactionType.BUY]: {
    [TransactionStatus.Pending]: i18n._(msg`Buying`),
    [TransactionStatus.Confirmed]: i18n._(msg`Boughmsg`),
    [TransactionStatus.Failed]: i18n._(msg`Buy failed`),
  },
  [TransactionType.SEND]: {
    [TransactionStatus.Pending]: i18n._(msg`Sending`),
    [TransactionStatus.Confirmed]: i18n._(msg`Senmsg`),
    [TransactionStatus.Failed]: i18n._(msg`Send failed`),
  },
  [TransactionType.RECEIVE]: {
    [TransactionStatus.Pending]: i18n._(msg`Receiving`),
    [TransactionStatus.Confirmed]: i18n._(msg`Received`),
    [TransactionStatus.Failed]: i18n._(msg`Receive failed`),
  },
  [TransactionType.MINT]: {
    [TransactionStatus.Pending]: i18n._(msg`Minting`),
    [TransactionStatus.Confirmed]: i18n._(msg`Minted`),
    [TransactionStatus.Failed]: i18n._(msg`Mint failed`),
  },
  [TransactionType.BURN]: {
    [TransactionStatus.Pending]: i18n._(msg`Burning`),
    [TransactionStatus.Confirmed]: i18n._(msg`Burned`),
    [TransactionStatus.Failed]: i18n._(msg`Burn failed`),
  },
  [TransactionType.VOTE]: {
    [TransactionStatus.Pending]: i18n._(msg`Voting`),
    [TransactionStatus.Confirmed]: i18n._(msg`Voted`),
    [TransactionStatus.Failed]: i18n._(msg`Vote failed`),
  },
  [TransactionType.QUEUE]: {
    [TransactionStatus.Pending]: i18n._(msg`Queuing`),
    [TransactionStatus.Confirmed]: i18n._(msg`Queued`),
    [TransactionStatus.Failed]: i18n._(msg`Queue failed`),
  },
  [TransactionType.EXECUTE]: {
    [TransactionStatus.Pending]: i18n._(msg`Executing`),
    [TransactionStatus.Confirmed]: i18n._(msg`Executed`),
    [TransactionStatus.Failed]: i18n._(msg`Execute failed`),
  },
  [TransactionType.BORROW]: {
    [TransactionStatus.Pending]: i18n._(msg`Borrowing`),
    [TransactionStatus.Confirmed]: i18n._(msg`Borrowed`),
    [TransactionStatus.Failed]: i18n._(msg`Borrow failed`),
  },
  [TransactionType.REPAY]: {
    [TransactionStatus.Pending]: i18n._(msg`Repaying`),
    [TransactionStatus.Confirmed]: i18n._(msg`Repaid`),
    [TransactionStatus.Failed]: i18n._(msg`Repay failed`),
  },
  [TransactionType.DEPLOY]: {
    [TransactionStatus.Pending]: i18n._(msg`Deploying`),
    [TransactionStatus.Confirmed]: i18n._(msg`Deployed`),
    [TransactionStatus.Failed]: i18n._(msg`Deploy failed`),
  },
  [TransactionType.CANCEL]: {
    [TransactionStatus.Pending]: i18n._(msg`Cancelling`),
    [TransactionStatus.Confirmed]: i18n._(msg`Cancelled`),
    [TransactionStatus.Failed]: i18n._(msg`Cancel failed`),
  },
  [TransactionType.DELEGATE]: {
    [TransactionStatus.Pending]: i18n._(msg`Delegating`),
    [TransactionStatus.Confirmed]: i18n._(msg`Delegated`),
    [TransactionStatus.Failed]: i18n._(msg`Delegate failed`),
  },
  [TransactionType.DEPOSIT_LIQUIDITY_STAKING]: {
    [TransactionStatus.Pending]: i18n._(msg`Depositing`),
    [TransactionStatus.Confirmed]: i18n._(msg`Deposited`),
    [TransactionStatus.Failed]: i18n._(msg`Deposit failed`),
  },
  [TransactionType.WITHDRAW_LIQUIDITY_STAKING]: {
    [TransactionStatus.Pending]: i18n._(msg`Withdrawing`),
    [TransactionStatus.Confirmed]: i18n._(msg`Withdrew`),
    [TransactionStatus.Failed]: i18n._(msg`Withdraw failed`),
  },
  [TransactionType.ADD_LIQUIDITY_V2_POOL]: {
    [TransactionStatus.Pending]: i18n._(msg`Adding V2 liquidity`),
    [TransactionStatus.Confirmed]: i18n._(msg`Added V2 liquidity`),
    [TransactionStatus.Failed]: i18n._(msg`Add V2 liquidity failed`),
  },
  [TransactionType.MIGRATE_LIQUIDITY_V3]: {
    [TransactionStatus.Pending]: i18n._(msg`Migrating liquidity`),
    [TransactionStatus.Confirmed]: i18n._(msg`Migrated liquidity`),
    [TransactionStatus.Failed]: i18n._(msg`Migrate liquidity failed`),
  },
  [TransactionType.SUBMIT_PROPOSAL]: {
    [TransactionStatus.Pending]: i18n._(msg`Submitting proposal`),
    [TransactionStatus.Confirmed]: i18n._(msg`Submitted proposal`),
    [TransactionStatus.Failed]: i18n._(msg`Submit proposal failed`),
  },
}

export const CancelledTransactionTitleTable: { [key in TransactionType]: string } = {
  [TransactionType.SWAP]: i18n._(msg`Swap cancelled`),
  [TransactionType.WRAP]: i18n._(msg`Wrap cancelled`),
  [TransactionType.ADD_LIQUIDITY_V3_POOL]: i18n._(msg`Add liquidity cancelled`),
  [TransactionType.REMOVE_LIQUIDITY_V3]: i18n._(msg`Remove liquidity cancelled`),
  [TransactionType.CREATE_V3_POOL]: i18n._(msg`Create pool cancelled`),
  [TransactionType.COLLECT_FEES]: i18n._(msg`Collect fees cancelled`),
  [TransactionType.APPROVAL]: i18n._(msg`Approval cancelled`),
  [TransactionType.CLAIM]: i18n._(msg`Claim cancelled`),
  [TransactionType.BUY]: i18n._(msg`Buy cancelled`),
  [TransactionType.SEND]: i18n._(msg`Send cancelled`),
  [TransactionType.RECEIVE]: i18n._(msg`Receive cancelled`),
  [TransactionType.MINT]: i18n._(msg`Mint cancelled`),
  [TransactionType.BURN]: i18n._(msg`Burn cancelled`),
  [TransactionType.VOTE]: i18n._(msg`Vote cancelled`),
  [TransactionType.QUEUE]: i18n._(msg`Queue cancelled`),
  [TransactionType.EXECUTE]: i18n._(msg`Execute cancelled`),
  [TransactionType.BORROW]: i18n._(msg`Borrow cancelled`),
  [TransactionType.REPAY]: i18n._(msg`Repay cancelled`),
  [TransactionType.DEPLOY]: i18n._(msg`Deploy cancelled`),
  [TransactionType.CANCEL]: i18n._(msg`Cancellation cancelled`),
  [TransactionType.DELEGATE]: i18n._(msg`Delegate cancelled`),
  [TransactionType.DEPOSIT_LIQUIDITY_STAKING]: i18n._(msg`Deposit cancelled`),
  [TransactionType.WITHDRAW_LIQUIDITY_STAKING]: i18n._(msg`Withdrawal cancelled`),
  [TransactionType.ADD_LIQUIDITY_V2_POOL]: i18n._(msg`Add V2 liquidity cancelled`),
  [TransactionType.MIGRATE_LIQUIDITY_V3]: i18n._(msg`Migrate liquidity cancelled`),
  [TransactionType.SUBMIT_PROPOSAL]: i18n._(msg`Submit proposal cancelled`),
}

const AlternateTransactionTitleTable: {
  [key in TransactionType]?: { [state in TransactionStatus]: string }
} = {
  [TransactionType.WRAP]: {
    [TransactionStatus.Pending]: i18n._(msg`Unwrapping`),
    [TransactionStatus.Confirmed]: i18n._(msg`Unwrapped`),
    [TransactionStatus.Failed]: i18n._(msg`Unwrap failed`),
  },
  [TransactionType.APPROVAL]: {
    [TransactionStatus.Pending]: i18n._(msg`Revoking approval`),
    [TransactionStatus.Confirmed]: i18n._(msg`Revoked approval`),
    [TransactionStatus.Failed]: i18n._(msg`Revoke approval failed`),
  },
}

export function getActivityTitle(type: TransactionType, status: TransactionStatus, alternate?: boolean) {
  if (alternate) {
    const alternateTitle = AlternateTransactionTitleTable[type]
    if (alternateTitle !== undefined) return alternateTitle[status]
  }
  return TransactionTitleTable[type][status]
}

const SwapTitleTable = TransactionTitleTable[TransactionType.SWAP]
export const OrderTextTable: {
  [status in UniswapXOrderStatus]: { title: string; status: TransactionStatus; statusMessage?: string }
} = {
  [UniswapXOrderStatus.OPEN]: {
    title: SwapTitleTable.PENDING,
    status: TransactionStatus.Pending,
  },
  [UniswapXOrderStatus.FILLED]: {
    title: SwapTitleTable.CONFIRMED,
    status: TransactionStatus.Confirmed,
  },
  [UniswapXOrderStatus.EXPIRED]: {
    title: i18n._(msg`Swap expired`),
    statusMessage: i18n._(msg`Your swap could not be fulfilled at this time. Please try again.`),
    status: TransactionStatus.Failed,
  },
  [UniswapXOrderStatus.ERROR]: {
    title: SwapTitleTable.FAILED,
    status: TransactionStatus.Failed,
  },
  [UniswapXOrderStatus.INSUFFICIENT_FUNDS]: {
    title: SwapTitleTable.FAILED,
    statusMessage: i18n._(`Your account had insufficent funds to complete this swap.`),
    status: TransactionStatus.Failed,
  },
  [UniswapXOrderStatus.CANCELLED]: {
    title: i18n._(msg`Swap cancelled`),
    status: TransactionStatus.Failed,
  },
}

// Non-exhaustive list of addresses Moonpay uses when sending purchased tokens
export const MOONPAY_SENDER_ADDRESSES = [
  '0x8216874887415e2650d12d53ff53516f04a74fd7',
  '0x151b381058f91cf871e7ea1ee83c45326f61e96d',
  '0xb287eac48ab21c5fb1d3723830d60b4c797555b0',
  '0xd108fd0e8c8e71552a167e7a44ff1d345d233ba6',
]

// Converts GQL backend orderStatus enum to the enum used by the frontend and UniswapX backend
export const OrderStatusTable: { [key in SwapOrderStatus]: UniswapXOrderStatus } = {
  [SwapOrderStatus.Open]: UniswapXOrderStatus.OPEN,
  [SwapOrderStatus.Expired]: UniswapXOrderStatus.EXPIRED,
  [SwapOrderStatus.Error]: UniswapXOrderStatus.ERROR,
  [SwapOrderStatus.InsufficientFunds]: UniswapXOrderStatus.INSUFFICIENT_FUNDS,
}
