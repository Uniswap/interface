import { t } from 'i18n'
import { TransactionType } from 'state/transactions/types'
import { UniswapXOrderStatus } from 'types/uniswapx'
import { TransactionStatus } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'

// use even number because rows are in groups of 2
export const DEFAULT_NFT_QUERY_AMOUNT = 26

const TransactionTitleTable: { [key in TransactionType]: { [state in TransactionStatus]: string } } = {
  [TransactionType.SWAP]: {
    [TransactionStatus.Pending]: t('common.swapping'),
    [TransactionStatus.Confirmed]: t('common.swapped'),
    [TransactionStatus.Failed]: t('common.swap.failed'),
  },
  [TransactionType.WRAP]: {
    [TransactionStatus.Pending]: t('common.wrapping'),
    [TransactionStatus.Confirmed]: t('common.wrapped'),
    [TransactionStatus.Failed]: t('common.wrap.failed'),
  },
  [TransactionType.ADD_LIQUIDITY_V3_POOL]: {
    [TransactionStatus.Pending]: t('common.adding.liquidity'),
    [TransactionStatus.Confirmed]: t('common.added.liquidity'),
    [TransactionStatus.Failed]: t('common.add.liquidity.failed'),
  },
  [TransactionType.REMOVE_LIQUIDITY_V3]: {
    [TransactionStatus.Pending]: t('common.removing.liquidity'),
    [TransactionStatus.Confirmed]: t('common.removed.liquidity'),
    [TransactionStatus.Failed]: t('common.remove.liquidity.failed'),
  },
  [TransactionType.CREATE_V3_POOL]: {
    [TransactionStatus.Pending]: t('common.creating.pool'),
    [TransactionStatus.Confirmed]: t('common.created.pool'),
    [TransactionStatus.Failed]: t('common.create.pool.failed'),
  },
  [TransactionType.COLLECT_FEES]: {
    [TransactionStatus.Pending]: t('common.collecting.fees'),
    [TransactionStatus.Confirmed]: t('common.collected.fees'),
    [TransactionStatus.Failed]: t('common.collect.fees.failed'),
  },
  [TransactionType.APPROVAL]: {
    [TransactionStatus.Pending]: t('common.approving'),
    [TransactionStatus.Confirmed]: t('common.approved'),
    [TransactionStatus.Failed]: t('common.approval.failed'),
  },
  [TransactionType.CLAIM]: {
    [TransactionStatus.Pending]: t('common.claiming'),
    [TransactionStatus.Confirmed]: t('common.claimed'),
    [TransactionStatus.Failed]: t('common.claim.failed'),
  },
  [TransactionType.BUY]: {
    [TransactionStatus.Pending]: t('Buying'),
    [TransactionStatus.Confirmed]: t('common.bought'),
    [TransactionStatus.Failed]: t('common.buy.failed'),
  },
  [TransactionType.SEND]: {
    [TransactionStatus.Pending]: t('common.sending'),
    [TransactionStatus.Confirmed]: t('common.sent'),
    [TransactionStatus.Failed]: t('common.send.failed'),
  },
  [TransactionType.RECEIVE]: {
    [TransactionStatus.Pending]: t('common.receiving'),
    [TransactionStatus.Confirmed]: t('common.received'),
    [TransactionStatus.Failed]: t('common.receive.failed'),
  },
  [TransactionType.MINT]: {
    [TransactionStatus.Pending]: t('common.minting'),
    [TransactionStatus.Confirmed]: t('common.minted'),
    [TransactionStatus.Failed]: t('common.mint.failed'),
  },
  [TransactionType.BURN]: {
    [TransactionStatus.Pending]: t('common.burning'),
    [TransactionStatus.Confirmed]: t('common.burned'),
    [TransactionStatus.Failed]: t('common.burn.failed'),
  },
  [TransactionType.VOTE]: {
    [TransactionStatus.Pending]: t('common.voting'),
    [TransactionStatus.Confirmed]: t('common.voted'),
    [TransactionStatus.Failed]: t('common.vote.failed'),
  },
  [TransactionType.QUEUE]: {
    [TransactionStatus.Pending]: t('common.queuing'),
    [TransactionStatus.Confirmed]: t('common.queued'),
    [TransactionStatus.Failed]: t('common.queue.failed'),
  },
  [TransactionType.EXECUTE]: {
    [TransactionStatus.Pending]: t('common.executing'),
    [TransactionStatus.Confirmed]: t('common.executed'),
    [TransactionStatus.Failed]: t('common.execute.failed'),
  },
  [TransactionType.BORROW]: {
    [TransactionStatus.Pending]: t('common.borrowing'),
    [TransactionStatus.Confirmed]: t('common.borrowed'),
    [TransactionStatus.Failed]: t('common.borrow.failed'),
  },
  [TransactionType.REPAY]: {
    [TransactionStatus.Pending]: t('common.repaying'),
    [TransactionStatus.Confirmed]: t('common.repaid'),
    [TransactionStatus.Failed]: t('common.repay.failed'),
  },
  [TransactionType.DEPLOY]: {
    [TransactionStatus.Pending]: t('common.deploying'),
    [TransactionStatus.Confirmed]: t('common.deployed'),
    [TransactionStatus.Failed]: t('common.deploy.failed'),
  },
  [TransactionType.CANCEL]: {
    [TransactionStatus.Pending]: t('common.cancelling'),
    [TransactionStatus.Confirmed]: t('common.cancelled'),
    [TransactionStatus.Failed]: t('common.cancel.failed'),
  },
  [TransactionType.DELEGATE]: {
    [TransactionStatus.Pending]: t('common.delegating'),
    [TransactionStatus.Confirmed]: t('common.delegated'),
    [TransactionStatus.Failed]: t('common.delegate.failed'),
  },
  [TransactionType.DEPOSIT_LIQUIDITY_STAKING]: {
    [TransactionStatus.Pending]: t('common.depositing'),
    [TransactionStatus.Confirmed]: t('common.deposited'),
    [TransactionStatus.Failed]: t('common.deposit.failed'),
  },
  [TransactionType.WITHDRAW_LIQUIDITY_STAKING]: {
    [TransactionStatus.Pending]: t('common.withdrawing'),
    [TransactionStatus.Confirmed]: t('common.withdrew'),
    [TransactionStatus.Failed]: t('common.withdraw.failed'),
  },
  [TransactionType.ADD_LIQUIDITY_V2_POOL]: {
    [TransactionStatus.Pending]: t('common.adding.v2.liquidity'),
    [TransactionStatus.Confirmed]: t('common.added.v2.liquidity'),
    [TransactionStatus.Failed]: t('common.add.v2.liquidity.failed'),
  },
  [TransactionType.MIGRATE_LIQUIDITY_V3]: {
    [TransactionStatus.Pending]: t('common.migrating.liquidity'),
    [TransactionStatus.Confirmed]: t('common.migrated.liquidity'),
    [TransactionStatus.Failed]: t('common.migrate.liquidity.failed'),
  },
  [TransactionType.SUBMIT_PROPOSAL]: {
    [TransactionStatus.Pending]: t('common.submitting.proposal'),
    [TransactionStatus.Confirmed]: t('common.submitted.proposal'),
    [TransactionStatus.Failed]: t('common.submit.proposal.failed'),
  },
  [TransactionType.LIMIT]: {
    [TransactionStatus.Pending]: t('common.limit.opened'),
    [TransactionStatus.Confirmed]: t('common.limit.executed'),
    [TransactionStatus.Failed]: t('common.limit.failed'),
  },
}

export const CancelledTransactionTitleTable: { [key in TransactionType]: string } = {
  [TransactionType.SWAP]: t('common.swap.cancelled'),
  [TransactionType.WRAP]: t('common.wrap.cancelled'),
  [TransactionType.ADD_LIQUIDITY_V3_POOL]: t('common.add.liquidity.cancelled'),
  [TransactionType.REMOVE_LIQUIDITY_V3]: t('common.remove.liquidity.cancelled'),
  [TransactionType.CREATE_V3_POOL]: t('common.create.pool.cancelled'),
  [TransactionType.COLLECT_FEES]: t('common.collect.fees.cancelled'),
  [TransactionType.APPROVAL]: t('common.approval.cancelled'),
  [TransactionType.CLAIM]: t('common.claim.cancelled'),
  [TransactionType.BUY]: t('common.buy.cancelled'),
  [TransactionType.SEND]: t('common.send.cancelled'),
  [TransactionType.RECEIVE]: t('common.receive.cancelled'),
  [TransactionType.MINT]: t('common.mint.cancelled'),
  [TransactionType.BURN]: t('common.burn.cancelled'),
  [TransactionType.VOTE]: t('common.vote.cancelled'),
  [TransactionType.QUEUE]: t('common.queue.cancelled'),
  [TransactionType.EXECUTE]: t('common.execute.cancelled'),
  [TransactionType.BORROW]: t('common.borrow.cancelled'),
  [TransactionType.REPAY]: t('common.repay.cancelled'),
  [TransactionType.DEPLOY]: t('common.deploy.cancelled'),
  [TransactionType.CANCEL]: t('common.cancellation.cancelled'),
  [TransactionType.DELEGATE]: t('common.delegate.cancelled'),
  [TransactionType.DEPOSIT_LIQUIDITY_STAKING]: t('common.deposit.cancelled'),
  [TransactionType.WITHDRAW_LIQUIDITY_STAKING]: t('common.withdrawal.cancelled'),
  [TransactionType.ADD_LIQUIDITY_V2_POOL]: t('common.add.v2.liquidity.cancelled'),
  [TransactionType.MIGRATE_LIQUIDITY_V3]: t('common.migrate.liquidity.cancelled'),
  [TransactionType.SUBMIT_PROPOSAL]: t('common.submit.proposal.cancelled'),
  [TransactionType.LIMIT]: t('common.limit.cancelled'),
}

const AlternateTransactionTitleTable: { [key in TransactionType]?: { [state in TransactionStatus]: string } } = {
  [TransactionType.WRAP]: {
    [TransactionStatus.Pending]: t('common.unwrapping'),
    [TransactionStatus.Confirmed]: t('common.unwrapped'),
    [TransactionStatus.Failed]: t('common.unwrap.failed'),
  },
  [TransactionType.APPROVAL]: {
    [TransactionStatus.Pending]: t('common.revoking.approval'),
    [TransactionStatus.Confirmed]: t('common.revoked.approval'),
    [TransactionStatus.Failed]: t('common.revoke.approval.failed'),
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
    title: t('common.swap.expired'),
    statusMessage: t('common.your.swap.could.not.be.fulfilled'),
    status: TransactionStatus.Failed,
  },
  [UniswapXOrderStatus.ERROR]: {
    title: SwapTitleTable.FAILED,
    status: TransactionStatus.Failed,
  },
  [UniswapXOrderStatus.INSUFFICIENT_FUNDS]: {
    title: t('common.insufficient.funds'),
    statusMessage: t('common.your.account.had.insufficient.funds'),
    status: TransactionStatus.Failed,
  },
  [UniswapXOrderStatus.PENDING_CANCELLATION]: {
    title: t('common.pending.cancellation'),
    status: TransactionStatus.Pending,
  },
  [UniswapXOrderStatus.CANCELLED]: {
    title: t('common.swap.cancelled'),
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
    title: t('common.limit.expired'),
    statusMessage: t('common.your.limit.could.not.be.fulfilled'),
    status: TransactionStatus.Failed,
  },
  [UniswapXOrderStatus.ERROR]: {
    title: LimitTitleTable.FAILED,
    status: TransactionStatus.Failed,
  },
  [UniswapXOrderStatus.INSUFFICIENT_FUNDS]: {
    title: LimitTitleTable.PENDING,
    statusMessage: t('common.your.account.has.insufficient.funds'),
    status: TransactionStatus.Pending,
  },
  [UniswapXOrderStatus.PENDING_CANCELLATION]: {
    title: t('common.pending.cancellation'),
    status: TransactionStatus.Pending,
  },
  [UniswapXOrderStatus.CANCELLED]: {
    title: t('common.limit.cancelled'),
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
