import { TransactionType } from 'state/transactions/types'
import { UniswapXOrderStatus } from 'types/uniswapx'
import { TransactionStatus } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import i18n from 'uniswap/src/i18n'

// use even number because rows are in groups of 2
export const DEFAULT_NFT_QUERY_AMOUNT = 26

const TransactionTitleTable: { [key in TransactionType]: { [state in TransactionStatus]: string } } = {
  [TransactionType.SWAP]: {
    [TransactionStatus.Pending]: i18n.t('common.swapping'),
    [TransactionStatus.Confirmed]: i18n.t('common.swapped'),
    [TransactionStatus.Failed]: i18n.t('common.swap.failed'),
  },
  [TransactionType.WRAP]: {
    [TransactionStatus.Pending]: i18n.t('common.wrapping'),
    [TransactionStatus.Confirmed]: i18n.t('common.wrapped'),
    [TransactionStatus.Failed]: i18n.t('common.wrap.failed'),
  },
  [TransactionType.ADD_LIQUIDITY_V3_POOL]: {
    [TransactionStatus.Pending]: i18n.t('common.adding.liquidity'),
    [TransactionStatus.Confirmed]: i18n.t('common.added.liquidity'),
    [TransactionStatus.Failed]: i18n.t('common.add.liquidity.failed'),
  },
  [TransactionType.REMOVE_LIQUIDITY_V3]: {
    [TransactionStatus.Pending]: i18n.t('common.removing.liquidity'),
    [TransactionStatus.Confirmed]: i18n.t('common.removedLiquidity'),
    [TransactionStatus.Failed]: i18n.t('common.remove.liquidity.failed'),
  },
  [TransactionType.CREATE_V3_POOL]: {
    [TransactionStatus.Pending]: i18n.t('common.creating.pool'),
    [TransactionStatus.Confirmed]: i18n.t('common.created.pool'),
    [TransactionStatus.Failed]: i18n.t('common.create.pool.failed'),
  },
  [TransactionType.COLLECT_FEES]: {
    [TransactionStatus.Pending]: i18n.t('common.collecting.fees'),
    [TransactionStatus.Confirmed]: i18n.t('common.collected.fees'),
    [TransactionStatus.Failed]: i18n.t('common.collect.fees.failed'),
  },
  [TransactionType.APPROVAL]: {
    [TransactionStatus.Pending]: i18n.t('common.approving'),
    [TransactionStatus.Confirmed]: i18n.t('common.approved'),
    [TransactionStatus.Failed]: i18n.t('common.approval.failed'),
  },
  [TransactionType.CLAIM]: {
    [TransactionStatus.Pending]: i18n.t('common.claiming'),
    [TransactionStatus.Confirmed]: i18n.t('common.claimed'),
    [TransactionStatus.Failed]: i18n.t('common.claim.failed'),
  },
  [TransactionType.BUY]: {
    [TransactionStatus.Pending]: i18n.t('common.buying'),
    [TransactionStatus.Confirmed]: i18n.t('common.bought'),
    [TransactionStatus.Failed]: i18n.t('common.buy.failed'),
  },
  [TransactionType.SEND]: {
    [TransactionStatus.Pending]: i18n.t('common.sending'),
    [TransactionStatus.Confirmed]: i18n.t('common.sent'),
    [TransactionStatus.Failed]: i18n.t('common.send.failed'),
  },
  [TransactionType.RECEIVE]: {
    [TransactionStatus.Pending]: i18n.t('common.receiving'),
    [TransactionStatus.Confirmed]: i18n.t('common.received'),
    [TransactionStatus.Failed]: i18n.t('common.receive.failed'),
  },
  [TransactionType.MINT]: {
    [TransactionStatus.Pending]: i18n.t('common.minting'),
    [TransactionStatus.Confirmed]: i18n.t('common.minted'),
    [TransactionStatus.Failed]: i18n.t('common.mint.failed'),
  },
  [TransactionType.BURN]: {
    [TransactionStatus.Pending]: i18n.t('common.burning'),
    [TransactionStatus.Confirmed]: i18n.t('common.burned'),
    [TransactionStatus.Failed]: i18n.t('common.burn.failed'),
  },
  [TransactionType.VOTE]: {
    [TransactionStatus.Pending]: i18n.t('common.voting'),
    [TransactionStatus.Confirmed]: i18n.t('common.voted'),
    [TransactionStatus.Failed]: i18n.t('common.vote.failed'),
  },
  [TransactionType.QUEUE]: {
    [TransactionStatus.Pending]: i18n.t('common.queuing'),
    [TransactionStatus.Confirmed]: i18n.t('common.queued'),
    [TransactionStatus.Failed]: i18n.t('common.queue.failed'),
  },
  [TransactionType.EXECUTE]: {
    [TransactionStatus.Pending]: i18n.t('common.executing'),
    [TransactionStatus.Confirmed]: i18n.t('common.executed'),
    [TransactionStatus.Failed]: i18n.t('common.execute.failed'),
  },
  [TransactionType.BORROW]: {
    [TransactionStatus.Pending]: i18n.t('common.borrowing'),
    [TransactionStatus.Confirmed]: i18n.t('common.borrowed'),
    [TransactionStatus.Failed]: i18n.t('common.borrow.failed'),
  },
  [TransactionType.REPAY]: {
    [TransactionStatus.Pending]: i18n.t('common.repaying'),
    [TransactionStatus.Confirmed]: i18n.t('common.repaid'),
    [TransactionStatus.Failed]: i18n.t('common.repay.failed'),
  },
  [TransactionType.DEPLOY]: {
    [TransactionStatus.Pending]: i18n.t('common.deploying'),
    [TransactionStatus.Confirmed]: i18n.t('common.deployed'),
    [TransactionStatus.Failed]: i18n.t('common.deploy.failed'),
  },
  [TransactionType.CANCEL]: {
    [TransactionStatus.Pending]: i18n.t('common.cancelling'),
    [TransactionStatus.Confirmed]: i18n.t('common.cancelled'),
    [TransactionStatus.Failed]: i18n.t('common.cancel.failed'),
  },
  [TransactionType.DELEGATE]: {
    [TransactionStatus.Pending]: i18n.t('common.delegating'),
    [TransactionStatus.Confirmed]: i18n.t('common.delegated'),
    [TransactionStatus.Failed]: i18n.t('common.delegate.failed'),
  },
  [TransactionType.DEPOSIT_LIQUIDITY_STAKING]: {
    [TransactionStatus.Pending]: i18n.t('common.depositing'),
    [TransactionStatus.Confirmed]: i18n.t('common.deposited'),
    [TransactionStatus.Failed]: i18n.t('common.deposit.failed'),
  },
  [TransactionType.WITHDRAW_LIQUIDITY_STAKING]: {
    [TransactionStatus.Pending]: i18n.t('common.withdrawing'),
    [TransactionStatus.Confirmed]: i18n.t('common.withdrew'),
    [TransactionStatus.Failed]: i18n.t('common.withdraw.failed'),
  },
  [TransactionType.ADD_LIQUIDITY_V2_POOL]: {
    [TransactionStatus.Pending]: i18n.t('common.adding.v2.liquidity'),
    [TransactionStatus.Confirmed]: i18n.t('common.added.v2.liquidity'),
    [TransactionStatus.Failed]: i18n.t('common.add.v2.liquidity.failed'),
  },
  [TransactionType.MIGRATE_LIQUIDITY_V2_TO_V3]: {
    [TransactionStatus.Pending]: i18n.t('common.migrating.liquidity'),
    [TransactionStatus.Confirmed]: i18n.t('common.migrated.liquidity'),
    [TransactionStatus.Failed]: i18n.t('common.migrate.liquidity.failed'),
  },
  [TransactionType.SUBMIT_PROPOSAL]: {
    [TransactionStatus.Pending]: i18n.t('common.submitting.proposal'),
    [TransactionStatus.Confirmed]: i18n.t('common.submitted.proposal'),
    [TransactionStatus.Failed]: i18n.t('common.submit.proposal.failed'),
  },
  [TransactionType.LIMIT]: {
    [TransactionStatus.Pending]: i18n.t('common.limit.opened'),
    [TransactionStatus.Confirmed]: i18n.t('common.limit.executed'),
    [TransactionStatus.Failed]: i18n.t('common.limit.failed'),
  },
  [TransactionType.INCREASE_LIQUIDITY]: {
    [TransactionStatus.Pending]: i18n.t('common.adding.liquidity'),
    [TransactionStatus.Confirmed]: i18n.t('common.added.liquidity'),
    [TransactionStatus.Failed]: i18n.t('common.add.liquidity.failed'),
  },
  [TransactionType.DECREASE_LIQUIDITY]: {
    [TransactionStatus.Pending]: i18n.t('common.removing.liquidity'),
    [TransactionStatus.Confirmed]: i18n.t('common.liquidity.removed'),
    [TransactionStatus.Failed]: i18n.t('common.remove.liquidity.failed'),
  },
  [TransactionType.CREATE_POSITION]: {
    [TransactionStatus.Pending]: i18n.t('position.create.modal.header'),
    [TransactionStatus.Confirmed]: i18n.t('pool.createdPosition'),
    [TransactionStatus.Failed]: i18n.t('pool.createdPosition.failed'),
  },
  [TransactionType.MIGRATE_LIQUIDITY_V3_TO_V4]: {
    [TransactionStatus.Pending]: i18n.t('common.migrating.liquidity'),
    [TransactionStatus.Confirmed]: i18n.t('common.migrated.liquidity'),
    [TransactionStatus.Failed]: i18n.t('common.migrate.liquidity.failed'),
  },
  [TransactionType.BRIDGE]: {
    [TransactionStatus.Pending]: i18n.t('common.swapping'),
    [TransactionStatus.Confirmed]: i18n.t('common.swapped'),
    [TransactionStatus.Failed]: i18n.t('common.swap.failed'),
  },
}

export const CancelledTransactionTitleTable: { [key in TransactionType]: string } = {
  [TransactionType.SWAP]: i18n.t('common.swap.cancelled'),
  [TransactionType.WRAP]: i18n.t('common.wrap.cancelled'),
  [TransactionType.ADD_LIQUIDITY_V3_POOL]: i18n.t('common.add.liquidity.cancelled'),
  [TransactionType.REMOVE_LIQUIDITY_V3]: i18n.t('common.remove.liquidity.cancelled'),
  [TransactionType.CREATE_V3_POOL]: i18n.t('common.create.pool.cancelled'),
  [TransactionType.COLLECT_FEES]: i18n.t('common.collect.fees.cancelled'),
  [TransactionType.APPROVAL]: i18n.t('common.approval.cancelled'),
  [TransactionType.CLAIM]: i18n.t('common.claim.cancelled'),
  [TransactionType.BUY]: i18n.t('common.buy.cancelled'),
  [TransactionType.SEND]: i18n.t('common.send.cancelled'),
  [TransactionType.RECEIVE]: i18n.t('common.receive.cancelled'),
  [TransactionType.MINT]: i18n.t('common.mint.cancelled'),
  [TransactionType.BURN]: i18n.t('common.burn.cancelled'),
  [TransactionType.VOTE]: i18n.t('common.vote.cancelled'),
  [TransactionType.QUEUE]: i18n.t('common.queue.cancelled'),
  [TransactionType.EXECUTE]: i18n.t('common.execute.cancelled'),
  [TransactionType.BORROW]: i18n.t('common.borrow.cancelled'),
  [TransactionType.REPAY]: i18n.t('common.repay.cancelled'),
  [TransactionType.DEPLOY]: i18n.t('common.deploy.cancelled'),
  [TransactionType.CANCEL]: i18n.t('common.cancellation.cancelled'),
  [TransactionType.DELEGATE]: i18n.t('common.delegate.cancelled'),
  [TransactionType.DEPOSIT_LIQUIDITY_STAKING]: i18n.t('common.deposit.cancelled'),
  [TransactionType.WITHDRAW_LIQUIDITY_STAKING]: i18n.t('common.withdrawal.cancelled'),
  [TransactionType.ADD_LIQUIDITY_V2_POOL]: i18n.t('common.add.v2.liquidity.cancelled'),
  [TransactionType.MIGRATE_LIQUIDITY_V2_TO_V3]: i18n.t('common.migrate.liquidity.cancelled'),
  [TransactionType.SUBMIT_PROPOSAL]: i18n.t('common.submit.proposal.cancelled'),
  [TransactionType.LIMIT]: i18n.t('common.limit.cancelled'),
  [TransactionType.INCREASE_LIQUIDITY]: i18n.t('common.add.liquidity.cancelled'),
  [TransactionType.DECREASE_LIQUIDITY]: i18n.t('common.remove.liquidity.cancelled'),
  [TransactionType.CREATE_POSITION]: i18n.t('pool.createdPosition.cancelled'),
  [TransactionType.MIGRATE_LIQUIDITY_V3_TO_V4]: i18n.t('common.migrate.liquidity.cancelled'),
  [TransactionType.BRIDGE]: i18n.t('common.swap.cancelled'),
}

const AlternateTransactionTitleTable: { [key in TransactionType]?: { [state in TransactionStatus]: string } } = {
  [TransactionType.WRAP]: {
    [TransactionStatus.Pending]: i18n.t('common.unwrapping'),
    [TransactionStatus.Confirmed]: i18n.t('common.unwrapped'),
    [TransactionStatus.Failed]: i18n.t('common.unwrap.failed'),
  },
  [TransactionType.APPROVAL]: {
    [TransactionStatus.Pending]: i18n.t('common.revoking.approval'),
    [TransactionStatus.Confirmed]: i18n.t('common.revoked.approval'),
    [TransactionStatus.Failed]: i18n.t('common.revoke.approval.failed'),
  },
}

export function getActivityTitle(type: TransactionType, status: TransactionStatus, alternate?: boolean) {
  if (alternate) {
    const alternateTitle = AlternateTransactionTitleTable[type]
    if (alternateTitle !== undefined) {
      return alternateTitle[status]
    }
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
    title: i18n.t('common.swap.expired'),
    statusMessage: i18n.t('common.your.swap.could.not.be.fulfilled'),
    status: TransactionStatus.Failed,
  },
  [UniswapXOrderStatus.ERROR]: {
    title: SwapTitleTable.FAILED,
    status: TransactionStatus.Failed,
  },
  [UniswapXOrderStatus.INSUFFICIENT_FUNDS]: {
    title: i18n.t('common.insufficient.funds'),
    statusMessage: i18n.t('common.your.account.had.insufficient.funds'),
    status: TransactionStatus.Failed,
  },
  [UniswapXOrderStatus.PENDING_CANCELLATION]: {
    title: i18n.t('common.pending.cancellation'),
    status: TransactionStatus.Pending,
  },
  [UniswapXOrderStatus.CANCELLED]: {
    title: i18n.t('common.swap.cancelled'),
    status: TransactionStatus.Failed,
  },
}

const LimitTitleTable = TransactionTitleTable[TransactionType.LIMIT]
export const LimitOrderTextTable: {
  [status in UniswapXOrderStatus]: { title: string; status: TransactionStatus; statusMessage?: string }
} = {
  [UniswapXOrderStatus.OPEN]: {
    title: LimitTitleTable.PENDING,
    status: TransactionStatus.Pending,
  },
  [UniswapXOrderStatus.FILLED]: {
    title: LimitTitleTable.CONFIRMED,
    status: TransactionStatus.Confirmed,
  },
  [UniswapXOrderStatus.EXPIRED]: {
    title: i18n.t('common.limit.expired'),
    statusMessage: i18n.t('common.your.limit.could.not.be.fulfilled'),
    status: TransactionStatus.Failed,
  },
  [UniswapXOrderStatus.ERROR]: {
    title: LimitTitleTable.FAILED,
    status: TransactionStatus.Failed,
  },
  [UniswapXOrderStatus.INSUFFICIENT_FUNDS]: {
    title: LimitTitleTable.PENDING,
    statusMessage: i18n.t('common.your.account.has.insufficient.funds'),
    status: TransactionStatus.Pending,
  },
  [UniswapXOrderStatus.PENDING_CANCELLATION]: {
    title: i18n.t('common.pending.cancellation'),
    status: TransactionStatus.Pending,
  },
  [UniswapXOrderStatus.CANCELLED]: {
    title: i18n.t('common.limit.cancelled'),
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
