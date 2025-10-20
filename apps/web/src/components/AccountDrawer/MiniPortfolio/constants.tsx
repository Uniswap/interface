import { TransactionStatus, TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
import i18n from 'uniswap/src/i18n'
import { logger } from 'utilities/src/logger/logger'

type TransactionStatusWeb = TransactionStatus.Success | TransactionStatus.Failed | TransactionStatus.Pending

// TODO(PORT-179): move to uniswap package and combine with wallet's `getTransactionSummaryTitle`
const getTransactionTitleTable = (): {
  [key in TransactionType]: {
    [state in TransactionStatusWeb]: string
  }
} => ({
  [TransactionType.Approve]: {
    [TransactionStatus.Pending]: i18n.t('common.approving'),
    [TransactionStatus.Success]: i18n.t('common.approved'),
    [TransactionStatus.Failed]: i18n.t('transaction.status.approval.failed'),
  },
  [TransactionType.Permit2Approve]: {
    [TransactionStatus.Pending]: i18n.t('common.approving'),
    [TransactionStatus.Success]: i18n.t('transaction.status.permit.approved'),
    [TransactionStatus.Failed]: i18n.t('transaction.status.permit.failed'),
  },
  [TransactionType.Bridge]: {
    [TransactionStatus.Pending]: i18n.t('transaction.status.swap.pending'),
    [TransactionStatus.Success]: i18n.t('transaction.status.swap.success'),
    [TransactionStatus.Failed]: i18n.t('common.swap.failed'),
  },
  [TransactionType.Swap]: {
    [TransactionStatus.Pending]: i18n.t('transaction.status.swap.pending'),
    [TransactionStatus.Success]: i18n.t('transaction.status.swap.success'),
    [TransactionStatus.Failed]: i18n.t('common.swap.failed'),
  },
  [TransactionType.Wrap]: {
    [TransactionStatus.Pending]: i18n.t('common.wrapping'),
    [TransactionStatus.Success]: i18n.t('common.wrapped'),
    [TransactionStatus.Failed]: i18n.t('common.wrap.failed'),
  },
  [TransactionType.NFTApprove]: {
    [TransactionStatus.Pending]: i18n.t('common.approving'),
    [TransactionStatus.Success]: i18n.t('common.approved'),
    [TransactionStatus.Failed]: i18n.t('transaction.status.approval.failed'),
  },
  [TransactionType.NFTTrade]: {
    [TransactionStatus.Pending]: i18n.t('transaction.status.swap.pending'),
    [TransactionStatus.Success]: i18n.t('transaction.status.swap.success'),
    [TransactionStatus.Failed]: i18n.t('common.swap.failed'),
  },
  [TransactionType.NFTMint]: {
    [TransactionStatus.Pending]: i18n.t('transaction.status.mint.pending'),
    [TransactionStatus.Success]: i18n.t('transaction.status.mint.success'),
    [TransactionStatus.Failed]: i18n.t('transaction.status.mint.failed'),
  },
  [TransactionType.Send]: {
    [TransactionStatus.Pending]: i18n.t('common.sending'),
    [TransactionStatus.Success]: i18n.t('common.sent'),
    [TransactionStatus.Failed]: i18n.t('common.send.failed'),
  },
  [TransactionType.Receive]: {
    [TransactionStatus.Pending]: i18n.t('transaction.status.receive.pending'),
    [TransactionStatus.Success]: i18n.t('common.received'),
    [TransactionStatus.Failed]: i18n.t('transaction.status.receive.failed'),
  },
  [TransactionType.FiatPurchaseDeprecated]: {
    [TransactionStatus.Pending]: i18n.t('transaction.status.purchase.pending'),
    [TransactionStatus.Success]: i18n.t('common.purchased'),
    [TransactionStatus.Failed]: i18n.t('transaction.status.purchase.failed'),
  },
  [TransactionType.LocalOnRamp]: {
    [TransactionStatus.Pending]: i18n.t('transaction.status.onramp.pending'),
    [TransactionStatus.Success]: i18n.t('transaction.status.onramp.success'),
    [TransactionStatus.Failed]: i18n.t('transaction.status.onramp.failed'),
  },
  [TransactionType.LocalOffRamp]: {
    [TransactionStatus.Pending]: i18n.t('transaction.status.offramp.pending'),
    [TransactionStatus.Success]: i18n.t('transaction.status.offramp.success'),
    [TransactionStatus.Failed]: i18n.t('transaction.status.offramp.failed'),
  },
  [TransactionType.OnRampPurchase]: {
    [TransactionStatus.Pending]: i18n.t('transaction.status.purchase.pending'),
    [TransactionStatus.Success]: i18n.t('common.purchased'),
    [TransactionStatus.Failed]: i18n.t('transaction.status.purchase.failed'),
  },
  [TransactionType.OnRampTransfer]: {
    [TransactionStatus.Pending]: i18n.t('common.sending'),
    [TransactionStatus.Success]: i18n.t('common.sent'),
    [TransactionStatus.Failed]: i18n.t('common.send.failed'),
  },
  [TransactionType.OffRampSale]: {
    [TransactionStatus.Pending]: i18n.t('transaction.status.sell.pending'),
    [TransactionStatus.Success]: i18n.t('common.sold'),
    [TransactionStatus.Failed]: i18n.t('transaction.status.sell.failed'),
  },
  [TransactionType.WCConfirm]: {
    [TransactionStatus.Pending]: i18n.t('transaction.status.confirm.pending'),
    [TransactionStatus.Success]: i18n.t('transaction.status.confirm.success'),
    [TransactionStatus.Failed]: i18n.t('transaction.status.confirm.failed'),
  },
  [TransactionType.Unknown]: {
    [TransactionStatus.Pending]: i18n.t('common.unknown'),
    [TransactionStatus.Success]: i18n.t('common.unknown'),
    [TransactionStatus.Failed]: i18n.t('common.unknown'),
  },
  [TransactionType.SendCalls]: {
    [TransactionStatus.Pending]: i18n.t('common.sending'),
    [TransactionStatus.Success]: i18n.t('common.sent'),
    [TransactionStatus.Failed]: i18n.t('common.send.failed'),
  },
  [TransactionType.CollectFees]: {
    [TransactionStatus.Pending]: i18n.t('transaction.status.collecting.fees'),
    [TransactionStatus.Success]: i18n.t('transaction.status.collected.fees'),
    [TransactionStatus.Failed]: i18n.t('transaction.status.collect.fees.failed'),
  },
  [TransactionType.CreatePair]: {
    [TransactionStatus.Pending]: i18n.t('position.create.modal.header'),
    [TransactionStatus.Success]: i18n.t('pool.createdPosition'),
    [TransactionStatus.Failed]: i18n.t('pool.createdPosition.failed'),
  },
  [TransactionType.CreatePool]: {
    [TransactionStatus.Pending]: i18n.t('position.create.modal.header'),
    [TransactionStatus.Success]: i18n.t('pool.createdPosition'),
    [TransactionStatus.Failed]: i18n.t('pool.createdPosition.failed'),
  },
  [TransactionType.LiquidityIncrease]: {
    [TransactionStatus.Pending]: i18n.t('transaction.status.liquidityIncrease.pending'),
    [TransactionStatus.Success]: i18n.t('transaction.status.liquidityIncrease.success'),
    [TransactionStatus.Failed]: i18n.t('transaction.status.liquidityIncrease.failed'),
  },
  [TransactionType.LiquidityDecrease]: {
    [TransactionStatus.Pending]: i18n.t('common.removing.liquidity'),
    [TransactionStatus.Success]: i18n.t('common.liquidity.removed'),
    [TransactionStatus.Failed]: i18n.t('common.remove.liquidity.failed'),
  },
  [TransactionType.MigrateLiquidityV2ToV3]: {
    [TransactionStatus.Pending]: i18n.t('common.migrating.liquidity'),
    [TransactionStatus.Success]: i18n.t('common.migrated.liquidity'),
    [TransactionStatus.Failed]: i18n.t('common.migrate.liquidity.failed'),
  },
  [TransactionType.MigrateLiquidityV3ToV4]: {
    [TransactionStatus.Pending]: i18n.t('common.migrating.liquidity'),
    [TransactionStatus.Success]: i18n.t('common.migrated.liquidity'),
    [TransactionStatus.Failed]: i18n.t('common.migrate.liquidity.failed'),
  },
  [TransactionType.ClaimUni]: {
    [TransactionStatus.Pending]: i18n.t('common.claiming'),
    [TransactionStatus.Success]: i18n.t('common.claimed'),
    [TransactionStatus.Failed]: i18n.t('common.claim.failed'),
  },
  [TransactionType.CreatePosition]: {
    [TransactionStatus.Pending]: i18n.t('position.create.modal.header'),
    [TransactionStatus.Success]: i18n.t('pool.createdPosition'),
    [TransactionStatus.Failed]: i18n.t('pool.createdPosition.failed'),
  },
  [TransactionType.LPIncentivesClaimRewards]: {
    [TransactionStatus.Pending]: i18n.t('pool.incentives.collectingRewards'),
    [TransactionStatus.Success]: i18n.t('pool.incentives.collectedRewards'),
    [TransactionStatus.Failed]: i18n.t('pool.incentives.collectFailedNoRetry'),
  },
  [TransactionType.UniswapXOrder]: {
    [TransactionStatus.Pending]: i18n.t('transaction.status.swap.pending'),
    [TransactionStatus.Success]: i18n.t('transaction.status.swap.success'),
    [TransactionStatus.Failed]: i18n.t('common.swap.failed'),
  },
  [TransactionType.RemoveDelegation]: {
    [TransactionStatus.Pending]: i18n.t('transaction.status.removeDelegation.pending'),
    [TransactionStatus.Success]: i18n.t('transaction.status.removeDelegation.success'),
    [TransactionStatus.Failed]: i18n.t('transaction.status.removeDelegation.failed'),
  },
})

export const getOrderTextTable = (): {
  [status in TransactionStatus]?: OrderTextTableEntry
} => {
  const TransactionTitleTable = getTransactionTitleTable()
  const SwapTitleTable = TransactionTitleTable[TransactionType.Swap]
  return {
    [TransactionStatus.Pending]: {
      getTitle: () => SwapTitleTable[TransactionStatus.Pending],
      status: TransactionStatus.Pending,
    },
    [TransactionStatus.Success]: {
      getTitle: () => SwapTitleTable[TransactionStatus.Success],
      status: TransactionStatus.Success,
    },
    [TransactionStatus.Expired]: {
      getTitle: () => i18n.t('common.swap.expired'),
      getStatusMessage: () => i18n.t('common.your.swap.could.not.be.fulfilled'),
      status: TransactionStatus.Failed,
    },
    [TransactionStatus.Failed]: {
      getTitle: () => SwapTitleTable[TransactionStatus.Failed],
      status: TransactionStatus.Failed,
    },
    [TransactionStatus.InsufficientFunds]: {
      getTitle: () => i18n.t('common.insufficient.funds'),
      getStatusMessage: () => i18n.t('common.your.account.had.insufficient.funds'),
      status: TransactionStatus.Failed,
    },
    [TransactionStatus.Cancelling]: {
      getTitle: () => i18n.t('common.pending.cancellation'),
      status: TransactionStatus.Pending,
    },
    [TransactionStatus.Canceled]: {
      getTitle: () => i18n.t('transaction.status.swap.canceled'),
      status: TransactionStatus.Failed,
    },
  }
}

export const getCancelledTransactionTitleTable = (): { [key in TransactionType]: string } => ({
  [TransactionType.Swap]: i18n.t('transaction.status.swap.canceled'),
  [TransactionType.Wrap]: i18n.t('transaction.status.wrap.canceled'),
  [TransactionType.CollectFees]: i18n.t('transaction.status.collect.fees.canceled'),
  [TransactionType.Approve]: i18n.t('transaction.status.approval.canceled'),
  [TransactionType.ClaimUni]: i18n.t('transaction.status.claim.canceled'),
  [TransactionType.LPIncentivesClaimRewards]: i18n.t('pool.incentives.collectRewardsCanceled'),
  [TransactionType.Send]: i18n.t('transaction.status.send.canceled'),
  [TransactionType.MigrateLiquidityV2ToV3]: i18n.t('transaction.status.migrateLiquidity.canceled'),
  [TransactionType.LiquidityIncrease]: i18n.t('common.add.liquidity.canceled'),
  [TransactionType.LiquidityDecrease]: i18n.t('common.remove.liquidity.canceled'),
  [TransactionType.CreatePool]: i18n.t('pool.createdPosition.canceled'),
  [TransactionType.CreatePair]: i18n.t('pool.createdPosition.canceled'),
  [TransactionType.MigrateLiquidityV3ToV4]: i18n.t('transaction.status.migrateLiquidity.canceled'),
  [TransactionType.Bridge]: i18n.t('transaction.status.swap.canceled'),
  [TransactionType.Permit2Approve]: i18n.t('transaction.status.permit.canceled'),
  [TransactionType.NFTApprove]: i18n.t('transaction.status.approval.canceled'),
  [TransactionType.NFTTrade]: i18n.t('transaction.status.swap.canceled'),
  [TransactionType.NFTMint]: i18n.t('transaction.status.mint.canceled'),
  [TransactionType.Receive]: i18n.t('transaction.status.receive.canceled'),
  [TransactionType.FiatPurchaseDeprecated]: i18n.t('transaction.status.purchase.canceled'),
  [TransactionType.LocalOnRamp]: i18n.t('transaction.status.onramp.canceled'),
  [TransactionType.LocalOffRamp]: i18n.t('transaction.status.offramp.canceled'),
  [TransactionType.OnRampPurchase]: i18n.t('transaction.status.purchase.canceled'),
  [TransactionType.OnRampTransfer]: i18n.t('transaction.status.send.canceled'),
  [TransactionType.OffRampSale]: i18n.t('transaction.status.sell.canceled'),
  [TransactionType.WCConfirm]: i18n.t('transaction.status.confirm.canceled'),
  [TransactionType.Unknown]: i18n.t('common.unknown'),
  [TransactionType.SendCalls]: i18n.t('transaction.status.send.canceled'),
  [TransactionType.CreatePosition]: i18n.t('pool.createdPosition.canceled'),
  [TransactionType.UniswapXOrder]: i18n.t('transaction.status.swap.canceled'),
  [TransactionType.RemoveDelegation]: i18n.t('transaction.status.removeDelegation.canceled'),
})

const getAlternateTransactionTitleTable = (): {
  [key in TransactionType]?: { [state in TransactionStatusWeb]: string }
} => ({
  [TransactionType.Wrap]: {
    [TransactionStatus.Pending]: i18n.t('common.unwrapping'),
    [TransactionStatus.Success]: i18n.t('common.unwrapped'),
    [TransactionStatus.Failed]: i18n.t('common.unwrap.failed'),
  },
  [TransactionType.Approve]: {
    [TransactionStatus.Pending]: i18n.t('common.revoking.approval'),
    [TransactionStatus.Success]: i18n.t('common.revoked.approval'),
    [TransactionStatus.Failed]: i18n.t('common.revoke.approval.failed'),
  },
})

export function getActivityTitle({
  type,
  status,
  alternate,
}: {
  type: TransactionType
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
    const AlternateTransactionTitleTable = getAlternateTransactionTitleTable()
    const alternateTitle = AlternateTransactionTitleTable[type]
    if (alternateTitle !== undefined) {
      return alternateTitle[status]
    }
  }

  const TransactionTitleTable = getTransactionTitleTable()
  return TransactionTitleTable[type][status]
}

interface OrderTextTableEntry {
  status: TransactionStatus
  getTitle: () => string
  getStatusMessage?: () => string
}

export const getLimitOrderTextTable = (): {
  [status in TransactionStatus]?: OrderTextTableEntry
} => ({
  [TransactionStatus.Pending]: {
    getTitle: () => i18n.t('common.limit.opened'),
    status: TransactionStatus.Pending,
  },
  [TransactionStatus.Success]: {
    getTitle: () => i18n.t('common.limit.executed'),
    status: TransactionStatus.Success,
  },
  [TransactionStatus.Expired]: {
    getTitle: () => i18n.t('common.limit.expired'),
    getStatusMessage: () => i18n.t('common.your.limit.could.not.be.fulfilled'),
    status: TransactionStatus.Failed,
  },
  [TransactionStatus.Failed]: {
    getTitle: () => i18n.t('common.limit.failed'),
    status: TransactionStatus.Failed,
  },
  [TransactionStatus.InsufficientFunds]: {
    getTitle: () => i18n.t('common.limit.opened'),
    getStatusMessage: () => i18n.t('common.your.account.has.insufficient.funds'),
    status: TransactionStatus.Pending,
  },
  [TransactionStatus.Cancelling]: {
    getTitle: () => i18n.t('common.pending.cancellation'),
    status: TransactionStatus.Pending,
  },
  [TransactionStatus.Canceled]: {
    getTitle: () => i18n.t('common.limit.canceled'),
    status: TransactionStatus.Failed,
  },
})
