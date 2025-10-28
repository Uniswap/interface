import { SelectOption } from 'components/Dropdowns/DropdownSelector'
import { Approve } from 'ui/src/components/icons/Approve'
import { ArrowChange } from 'ui/src/components/icons/ArrowChange'
import { ArrowDownCircle } from 'ui/src/components/icons/ArrowDownCircle'
import { ArrowUpCircle } from 'ui/src/components/icons/ArrowUpCircle'
import { Dollar } from 'ui/src/components/icons/Dollar'
import { Plus } from 'ui/src/components/icons/Plus'
import { ReceiveAlt } from 'ui/src/components/icons/ReceiveAlt'
import { SendAction } from 'ui/src/components/icons/SendAction'
import { Sparkle } from 'ui/src/components/icons/Sparkle'
import { Swap } from 'ui/src/components/icons/Swap'
import { AppTFunction } from 'ui/src/i18n/types'
import { TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'

enum ActivityFilterType {
  All = 'all',
  Sends = 'sends',
  Receives = 'receives',
  Swaps = 'swaps',
  Wraps = 'wraps',
  Approves = 'approves',
  CreatePool = 'create-pool',
  AddLiquidity = 'add-liquidity',
  RemoveLiquidity = 'remove-liquidity',
  Mints = 'mints',
  ClaimFees = 'claim-fees',
}

export function getTransactionTypeFilterOptions(t: AppTFunction): Record<string, SelectOption> {
  return {
    [ActivityFilterType.All]: {
      label: t('portfolio.activity.filters.transactionType.all'),
      icon: null,
    },
    [ActivityFilterType.Swaps]: {
      label: t('portfolio.activity.filters.transactionType.swaps'),
      icon: Swap,
    },
    [ActivityFilterType.Sends]: {
      label: t('common.sent'),
      icon: SendAction,
    },
    [ActivityFilterType.Receives]: {
      label: t('common.received'),
      icon: ReceiveAlt,
    },
    [ActivityFilterType.Wraps]: {
      label: t('portfolio.activity.filters.transactionType.wraps'),
      icon: ArrowChange,
    },
    [ActivityFilterType.Approves]: {
      label: t('portfolio.activity.filters.transactionType.approvals'),
      icon: Approve,
    },
    [ActivityFilterType.CreatePool]: {
      label: t('portfolio.activity.filters.transactionType.createPool'),
      icon: Plus,
    },
    [ActivityFilterType.AddLiquidity]: {
      label: t('portfolio.activity.filters.transactionType.addLiquidity'),
      icon: ArrowDownCircle,
    },
    [ActivityFilterType.RemoveLiquidity]: {
      label: t('portfolio.activity.filters.transactionType.removeLiquidity'),
      icon: ArrowUpCircle,
    },
    [ActivityFilterType.Mints]: {
      label: t('portfolio.activity.filters.transactionType.mints'),
      icon: Sparkle,
    },
    [ActivityFilterType.ClaimFees]: {
      label: t('portfolio.activity.filters.transactionType.claimFees'),
      icon: Dollar,
    },
  }
}

/**
 * Maps filter type to transaction types that should be included
 */
export function getTransactionTypesForFilter(filterType: string): TransactionType[] | 'all' {
  switch (filterType) {
    case ActivityFilterType.Sends:
      return [TransactionType.Send]
    case ActivityFilterType.Receives:
      return [TransactionType.Receive]
    case ActivityFilterType.Swaps:
      return [TransactionType.Swap, TransactionType.Bridge]
    case ActivityFilterType.Wraps:
      return [TransactionType.Wrap]
    case ActivityFilterType.Approves:
      return [TransactionType.Approve]
    case ActivityFilterType.CreatePool:
      return [TransactionType.CreatePool, TransactionType.CreatePair]
    case ActivityFilterType.AddLiquidity:
      return [TransactionType.LiquidityIncrease]
    case ActivityFilterType.RemoveLiquidity:
      return [TransactionType.LiquidityDecrease]
    case ActivityFilterType.Mints:
      return [TransactionType.NFTMint]
    case ActivityFilterType.ClaimFees:
      return [TransactionType.CollectFees, TransactionType.LPIncentivesClaimRewards, TransactionType.ClaimUni]
    case ActivityFilterType.All:
    default:
      return 'all'
  }
}

enum TimePeriod {
  All = 'all',
  Last24Hours = '24h',
  Last7Days = '7d',
  Last30Days = '30d',
}

export function getTimePeriodFilterOptions(t: AppTFunction): Record<string, SelectOption> {
  return {
    [TimePeriod.All]: { label: t('portfolio.activity.filters.timePeriod.all') },
    [TimePeriod.Last24Hours]: { label: t('common.time.past.hours', { hours: 24 }) },
    [TimePeriod.Last7Days]: { label: t('common.time.past.days', { days: 7 }) },
    [TimePeriod.Last30Days]: { label: t('common.time.past.days', { days: 30 }) },
  }
}
