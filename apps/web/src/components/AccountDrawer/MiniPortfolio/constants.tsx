import { BaseTransactionType, TransactionType } from 'state/transactions/types'
import { UniswapXOrderStatus } from 'types/uniswapx'
import {
  TransactionStatus,
  TransactionType as UniswapTransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'

import i18n from 'uniswap/src/i18n'
import { logger } from 'utilities/src/logger/logger'

// use even number because rows are in groups of 2
export const DEFAULT_NFT_QUERY_AMOUNT = 26

type TransactionStatusWeb = TransactionStatus.Success | TransactionStatus.Failed | TransactionStatus.Pending

const TransactionTitleTable: {
  [key in BaseTransactionType]: {
    [state in TransactionStatusWeb]: string
  }
} = {
  [TransactionType.SWAP]: {
    [TransactionStatus.Pending]: i18n.t('common.swapping'),
    [TransactionStatus.Success]: i18n.t('common.swapped'),
    [TransactionStatus.Failed]: i18n.t('common.swap.failed'),
  },
  [TransactionType.WRAP]: {
    [TransactionStatus.Pending]: i18n.t('common.wrapping'),
    [TransactionStatus.Success]: i18n.t('common.wrapped'),
    [TransactionStatus.Failed]: i18n.t('common.wrap.failed'),
  },
  [TransactionType.COLLECT_FEES]: {
    [TransactionStatus.Pending]: i18n.t('common.collecting.fees'),
    [TransactionStatus.Success]: i18n.t('common.collected.fees'),
    [TransactionStatus.Failed]: i18n.t('common.collect.fees.failed'),
  },
  [TransactionType.LP_INCENTIVES_CLAIM_REWARDS]: {
    [TransactionStatus.Pending]: i18n.t('pool.incentives.collectingRewards'),
    [TransactionStatus.Success]: i18n.t('pool.incentives.collectedRewards'),
    [TransactionStatus.Failed]: i18n.t('pool.incentives.collectFailedNoRetry'),
  },
  [UniswapTransactionType.Approve]: {
    [TransactionStatus.Pending]: i18n.t('common.approving'),
    [TransactionStatus.Success]: i18n.t('common.approved'),
    [TransactionStatus.Failed]: i18n.t('common.approval.failed'),
  },
  [TransactionType.CLAIM]: {
    [TransactionStatus.Pending]: i18n.t('common.claiming'),
    [TransactionStatus.Success]: i18n.t('common.claimed'),
    [TransactionStatus.Failed]: i18n.t('common.claim.failed'),
  },
  [TransactionType.SEND]: {
    [TransactionStatus.Pending]: i18n.t('common.sending'),
    [TransactionStatus.Success]: i18n.t('common.sent'),
    [TransactionStatus.Failed]: i18n.t('common.send.failed'),
  },
  [TransactionType.MIGRATE_LIQUIDITY_V2_TO_V3]: {
    [TransactionStatus.Pending]: i18n.t('common.migrating.liquidity'),
    [TransactionStatus.Success]: i18n.t('common.migrated.liquidity'),
    [TransactionStatus.Failed]: i18n.t('common.migrate.liquidity.failed'),
  },
  [TransactionType.INCREASE_LIQUIDITY]: {
    [TransactionStatus.Pending]: i18n.t('common.adding.liquidity'),
    [TransactionStatus.Success]: i18n.t('common.added.liquidity'),
    [TransactionStatus.Failed]: i18n.t('common.add.liquidity.failed'),
  },
  [TransactionType.DECREASE_LIQUIDITY]: {
    [TransactionStatus.Pending]: i18n.t('common.removing.liquidity'),
    [TransactionStatus.Success]: i18n.t('common.liquidity.removed'),
    [TransactionStatus.Failed]: i18n.t('common.remove.liquidity.failed'),
  },
  [TransactionType.CREATE_POSITION]: {
    [TransactionStatus.Pending]: i18n.t('position.create.modal.header'),
    [TransactionStatus.Success]: i18n.t('pool.createdPosition'),
    [TransactionStatus.Failed]: i18n.t('pool.createdPosition.failed'),
  },
  [TransactionType.MIGRATE_LIQUIDITY_V3_TO_V4]: {
    [TransactionStatus.Pending]: i18n.t('common.migrating.liquidity'),
    [TransactionStatus.Success]: i18n.t('common.migrated.liquidity'),
    [TransactionStatus.Failed]: i18n.t('common.migrate.liquidity.failed'),
  },
  [TransactionType.BRIDGE]: {
    [TransactionStatus.Pending]: i18n.t('common.swapping'),
    [TransactionStatus.Success]: i18n.t('common.swapped'),
    [TransactionStatus.Failed]: i18n.t('common.swap.failed'),
  },
  [TransactionType.PERMIT]: {
    [TransactionStatus.Pending]: i18n.t('common.approving'),
    [TransactionStatus.Success]: i18n.t('common.permit.approved'),
    [TransactionStatus.Failed]: i18n.t('common.permit.failed'),
  },
}

export const CancelledTransactionTitleTable: { [key in BaseTransactionType]: string } = {
  [TransactionType.SWAP]: i18n.t('common.swap.cancelled'),
  [TransactionType.WRAP]: i18n.t('common.wrap.cancelled'),
  [TransactionType.COLLECT_FEES]: i18n.t('common.collect.fees.cancelled'),
  [UniswapTransactionType.Approve]: i18n.t('common.approval.cancelled'),
  [TransactionType.CLAIM]: i18n.t('common.claim.cancelled'),
  [TransactionType.LP_INCENTIVES_CLAIM_REWARDS]: i18n.t('pool.incentives.collectRewardsCancelled'),
  [TransactionType.SEND]: i18n.t('common.send.cancelled'),
  [TransactionType.MIGRATE_LIQUIDITY_V2_TO_V3]: i18n.t('common.migrate.liquidity.cancelled'),
  [TransactionType.INCREASE_LIQUIDITY]: i18n.t('common.add.liquidity.cancelled'),
  [TransactionType.DECREASE_LIQUIDITY]: i18n.t('common.remove.liquidity.cancelled'),
  [TransactionType.CREATE_POSITION]: i18n.t('pool.createdPosition.cancelled'),
  [TransactionType.MIGRATE_LIQUIDITY_V3_TO_V4]: i18n.t('common.migrate.liquidity.cancelled'),
  [TransactionType.BRIDGE]: i18n.t('common.swap.cancelled'),
  [TransactionType.PERMIT]: i18n.t('common.permit.cancelled'),
}

const AlternateTransactionTitleTable: { [key in BaseTransactionType]?: { [state in TransactionStatusWeb]: string } } = {
  [TransactionType.WRAP]: {
    [TransactionStatus.Pending]: i18n.t('common.unwrapping'),
    [TransactionStatus.Success]: i18n.t('common.unwrapped'),
    [TransactionStatus.Failed]: i18n.t('common.unwrap.failed'),
  },
  [UniswapTransactionType.Approve]: {
    [TransactionStatus.Pending]: i18n.t('common.revoking.approval'),
    [TransactionStatus.Success]: i18n.t('common.revoked.approval'),
    [TransactionStatus.Failed]: i18n.t('common.revoke.approval.failed'),
  },
}

export function getActivityTitle({
  type,
  status,
  alternate,
}: {
  type: BaseTransactionType
  status: TransactionStatus
  alternate?: boolean
}): string {
  if (
    status !== TransactionStatus.Pending &&
    status !== TransactionStatus.Failed &&
    status !== TransactionStatus.Success
  ) {
    logger.error(new Error(`Unhandled web transaction status`), {
      tags: {
        file: 'constants.tsx',
        function: 'getActivityTitle',
      },
      extra: { status },
    })
    return ''
  }

  if (alternate) {
    const alternateTitle = AlternateTransactionTitleTable[type]
    if (alternateTitle !== undefined) {
      return alternateTitle[status]
    }
  }
  return TransactionTitleTable[type][status]
}

interface OrderTextTableEntry {
  status: TransactionStatus
  getTitle: () => string
  getStatusMessage?: () => string
}

const SwapTitleTable = TransactionTitleTable[TransactionType.SWAP]
export const OrderTextTable: {
  [status in UniswapXOrderStatus]: OrderTextTableEntry
} = {
  [UniswapXOrderStatus.OPEN]: {
    getTitle: () => SwapTitleTable[TransactionStatus.Pending],
    status: TransactionStatus.Pending,
  },
  [UniswapXOrderStatus.FILLED]: {
    getTitle: () => SwapTitleTable[TransactionStatus.Success],
    status: TransactionStatus.Success,
  },
  [UniswapXOrderStatus.EXPIRED]: {
    getTitle: () => i18n.t('common.swap.expired'),
    getStatusMessage: () => i18n.t('common.your.swap.could.not.be.fulfilled'),
    status: TransactionStatus.Failed,
  },
  [UniswapXOrderStatus.ERROR]: {
    getTitle: () => SwapTitleTable[TransactionStatus.Failed],
    status: TransactionStatus.Failed,
  },
  [UniswapXOrderStatus.INSUFFICIENT_FUNDS]: {
    getTitle: () => i18n.t('common.insufficient.funds'),
    getStatusMessage: () => i18n.t('common.your.account.had.insufficient.funds'),
    status: TransactionStatus.Failed,
  },
  [UniswapXOrderStatus.PENDING_CANCELLATION]: {
    getTitle: () => i18n.t('common.pending.cancellation'),
    status: TransactionStatus.Pending,
  },
  [UniswapXOrderStatus.CANCELLED]: {
    getTitle: () => i18n.t('common.swap.cancelled'),
    status: TransactionStatus.Failed,
  },
}

export const LimitOrderTextTable: {
  [status in UniswapXOrderStatus]: OrderTextTableEntry
} = {
  [UniswapXOrderStatus.OPEN]: {
    getTitle: () => i18n.t('common.limit.opened'),
    status: TransactionStatus.Pending,
  },
  [UniswapXOrderStatus.FILLED]: {
    getTitle: () => i18n.t('common.limit.executed'),
    status: TransactionStatus.Success,
  },
  [UniswapXOrderStatus.EXPIRED]: {
    getTitle: () => i18n.t('common.limit.expired'),
    getStatusMessage: () => i18n.t('common.your.limit.could.not.be.fulfilled'),
    status: TransactionStatus.Failed,
  },
  [UniswapXOrderStatus.ERROR]: {
    getTitle: () => i18n.t('common.limit.failed'),
    status: TransactionStatus.Failed,
  },
  [UniswapXOrderStatus.INSUFFICIENT_FUNDS]: {
    getTitle: () => i18n.t('common.limit.opened'),
    getStatusMessage: () => i18n.t('common.your.account.has.insufficient.funds'),
    status: TransactionStatus.Pending,
  },
  [UniswapXOrderStatus.PENDING_CANCELLATION]: {
    getTitle: () => i18n.t('common.pending.cancellation'),
    status: TransactionStatus.Pending,
  },
  [UniswapXOrderStatus.CANCELLED]: {
    getTitle: () => i18n.t('common.limit.cancelled'),
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
