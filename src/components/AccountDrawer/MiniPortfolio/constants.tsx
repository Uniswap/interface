import { t } from '@lingui/macro'
import { SwapOrderStatus, TransactionStatus } from 'graphql/data/__generated__/types-and-hooks'
import { UniswapXOrderStatus } from 'lib/hooks/orders/types'
import { TransactionType } from 'state/transactions/types'

// use even number because rows are in groups of 2
export const DEFAULT_NFT_QUERY_AMOUNT = 26

const TransactionTitleTable: { [key in TransactionType]: { [state in TransactionStatus]: string } } = {
  [TransactionType.SWAP]: {
    [TransactionStatus.Pending]: t`Swapping`,
    [TransactionStatus.Confirmed]: t`Swapped`,
    [TransactionStatus.Failed]: t`Swap failed`,
  },
  [TransactionType.WRAP]: {
    [TransactionStatus.Pending]: t`Wrapping`,
    [TransactionStatus.Confirmed]: t`Wrapped`,
    [TransactionStatus.Failed]: t`Wrap failed`,
  },
  [TransactionType.ADD_LIQUIDITY_V3_POOL]: {
    [TransactionStatus.Pending]: t`Adding liquidity`,
    [TransactionStatus.Confirmed]: t`Added liquidity`,
    [TransactionStatus.Failed]: t`Add liquidity failed`,
  },
  [TransactionType.REMOVE_LIQUIDITY_V3]: {
    [TransactionStatus.Pending]: t`Removing liquidity`,
    [TransactionStatus.Confirmed]: t`Removed liquidity`,
    [TransactionStatus.Failed]: t`Remove liquidity failed`,
  },
  [TransactionType.CREATE_V3_POOL]: {
    [TransactionStatus.Pending]: t`Creating pool`,
    [TransactionStatus.Confirmed]: t`Created pool`,
    [TransactionStatus.Failed]: t`Create pool failed`,
  },
  [TransactionType.COLLECT_FEES]: {
    [TransactionStatus.Pending]: t`Collecting fees`,
    [TransactionStatus.Confirmed]: t`Collected fees`,
    [TransactionStatus.Failed]: t`Collect fees failed`,
  },
  [TransactionType.APPROVAL]: {
    [TransactionStatus.Pending]: t`Approving`,
    [TransactionStatus.Confirmed]: t`Approved`,
    [TransactionStatus.Failed]: t`Approval failed`,
  },
  [TransactionType.CLAIM]: {
    [TransactionStatus.Pending]: t`Claiming`,
    [TransactionStatus.Confirmed]: t`Claimed`,
    [TransactionStatus.Failed]: t`Claim failed`,
  },
  [TransactionType.BUY]: {
    [TransactionStatus.Pending]: t`Buying`,
    [TransactionStatus.Confirmed]: t`Bought`,
    [TransactionStatus.Failed]: t`Buy failed`,
  },
  [TransactionType.SEND]: {
    [TransactionStatus.Pending]: t`Sending`,
    [TransactionStatus.Confirmed]: t`Sent`,
    [TransactionStatus.Failed]: t`Send failed`,
  },
  [TransactionType.RECEIVE]: {
    [TransactionStatus.Pending]: t`Receiving`,
    [TransactionStatus.Confirmed]: t`Received`,
    [TransactionStatus.Failed]: t`Receive failed`,
  },
  [TransactionType.MINT]: {
    [TransactionStatus.Pending]: t`Minting`,
    [TransactionStatus.Confirmed]: t`Minted`,
    [TransactionStatus.Failed]: t`Mint failed`,
  },
  [TransactionType.BURN]: {
    [TransactionStatus.Pending]: t`Burning`,
    [TransactionStatus.Confirmed]: t`Burned`,
    [TransactionStatus.Failed]: t`Burn failed`,
  },
  [TransactionType.VOTE]: {
    [TransactionStatus.Pending]: t`Voting`,
    [TransactionStatus.Confirmed]: t`Voted`,
    [TransactionStatus.Failed]: t`Vote failed`,
  },
  [TransactionType.QUEUE]: {
    [TransactionStatus.Pending]: t`Queuing`,
    [TransactionStatus.Confirmed]: t`Queued`,
    [TransactionStatus.Failed]: t`Queue failed`,
  },
  [TransactionType.EXECUTE]: {
    [TransactionStatus.Pending]: t`Executing`,
    [TransactionStatus.Confirmed]: t`Executed`,
    [TransactionStatus.Failed]: t`Execute failed`,
  },
  [TransactionType.BORROW]: {
    [TransactionStatus.Pending]: t`Borrowing`,
    [TransactionStatus.Confirmed]: t`Borrowed`,
    [TransactionStatus.Failed]: t`Borrow failed`,
  },
  [TransactionType.REPAY]: {
    [TransactionStatus.Pending]: t`Repaying`,
    [TransactionStatus.Confirmed]: t`Repaid`,
    [TransactionStatus.Failed]: t`Repay failed`,
  },
  [TransactionType.DEPLOY]: {
    [TransactionStatus.Pending]: t`Deploying`,
    [TransactionStatus.Confirmed]: t`Deployed`,
    [TransactionStatus.Failed]: t`Deploy failed`,
  },
  [TransactionType.CANCEL]: {
    [TransactionStatus.Pending]: t`Cancelling`,
    [TransactionStatus.Confirmed]: t`Cancelled`,
    [TransactionStatus.Failed]: t`Cancel failed`,
  },
  [TransactionType.DELEGATE]: {
    [TransactionStatus.Pending]: t`Delegating`,
    [TransactionStatus.Confirmed]: t`Delegated`,
    [TransactionStatus.Failed]: t`Delegate failed`,
  },
  [TransactionType.DEPOSIT_LIQUIDITY_STAKING]: {
    [TransactionStatus.Pending]: t`Depositing`,
    [TransactionStatus.Confirmed]: t`Deposited`,
    [TransactionStatus.Failed]: t`Deposit failed`,
  },
  [TransactionType.WITHDRAW_LIQUIDITY_STAKING]: {
    [TransactionStatus.Pending]: t`Withdrawing`,
    [TransactionStatus.Confirmed]: t`Withdrew`,
    [TransactionStatus.Failed]: t`Withdraw failed`,
  },
  [TransactionType.ADD_LIQUIDITY_V2_POOL]: {
    [TransactionStatus.Pending]: t`Adding V2 liquidity`,
    [TransactionStatus.Confirmed]: t`Added V2 liquidity`,
    [TransactionStatus.Failed]: t`Add V2 liquidity failed`,
  },
  [TransactionType.MIGRATE_LIQUIDITY_V3]: {
    [TransactionStatus.Pending]: t`Migrating liquidity`,
    [TransactionStatus.Confirmed]: t`Migrated liquidity`,
    [TransactionStatus.Failed]: t`Migrate liquidity failed`,
  },
  [TransactionType.SUBMIT_PROPOSAL]: {
    [TransactionStatus.Pending]: t`Submitting proposal`,
    [TransactionStatus.Confirmed]: t`Submitted proposal`,
    [TransactionStatus.Failed]: t`Submit proposal failed`,
  },
}

export const CancelledTransactionTitleTable: { [key in TransactionType]: string } = {
  [TransactionType.SWAP]: t`Swap cancelled`,
  [TransactionType.WRAP]: t`Wrap cancelled`,
  [TransactionType.ADD_LIQUIDITY_V3_POOL]: t`Add liquidity cancelled`,
  [TransactionType.REMOVE_LIQUIDITY_V3]: t`Remove liquidity cancelled`,
  [TransactionType.CREATE_V3_POOL]: t`Create pool cancelled`,
  [TransactionType.COLLECT_FEES]: t`Collect fees cancelled`,
  [TransactionType.APPROVAL]: t`Approval cancelled`,
  [TransactionType.CLAIM]: t`Claim cancelled`,
  [TransactionType.BUY]: t`Buy cancelled`,
  [TransactionType.SEND]: t`Send cancelled`,
  [TransactionType.RECEIVE]: t`Receive cancelled`,
  [TransactionType.MINT]: t`Mint cancelled`,
  [TransactionType.BURN]: t`Burn cancelled`,
  [TransactionType.VOTE]: t`Vote cancelled`,
  [TransactionType.QUEUE]: t`Queue cancelled`,
  [TransactionType.EXECUTE]: t`Execute cancelled`,
  [TransactionType.BORROW]: t`Borrow cancelled`,
  [TransactionType.REPAY]: t`Repay cancelled`,
  [TransactionType.DEPLOY]: t`Deploy cancelled`,
  [TransactionType.CANCEL]: t`Cancellation cancelled`,
  [TransactionType.DELEGATE]: t`Delegate cancelled`,
  [TransactionType.DEPOSIT_LIQUIDITY_STAKING]: t`Deposit cancelled`,
  [TransactionType.WITHDRAW_LIQUIDITY_STAKING]: t`Withdrawal cancelled`,
  [TransactionType.ADD_LIQUIDITY_V2_POOL]: t`Add V2 liquidity cancelled`,
  [TransactionType.MIGRATE_LIQUIDITY_V3]: t`Migrate liquidity cancelled`,
  [TransactionType.SUBMIT_PROPOSAL]: t`Submit proposal cancelled`,
}

const AlternateTransactionTitleTable: { [key in TransactionType]?: { [state in TransactionStatus]: string } } = {
  [TransactionType.WRAP]: {
    [TransactionStatus.Pending]: t`Unwrapping`,
    [TransactionStatus.Confirmed]: t`Unwrapped`,
    [TransactionStatus.Failed]: t`Unwrap failed`,
  },
  [TransactionType.APPROVAL]: {
    [TransactionStatus.Pending]: t`Revoking approval`,
    [TransactionStatus.Confirmed]: t`Revoked approval`,
    [TransactionStatus.Failed]: t`Revoke approval failed`,
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
    title: t`Swap expired`,
    statusMessage: t`Your swap could not be fulfilled at this time. Please try again.`,
    status: TransactionStatus.Failed,
  },
  [UniswapXOrderStatus.ERROR]: {
    title: SwapTitleTable.FAILED,
    status: TransactionStatus.Failed,
  },
  [UniswapXOrderStatus.INSUFFICIENT_FUNDS]: {
    title: SwapTitleTable.FAILED,
    statusMessage: t`Your account had insufficent funds to complete this swap.`,
    status: TransactionStatus.Failed,
  },
  [UniswapXOrderStatus.CANCELLED]: {
    title: t`Swap cancelled`,
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
