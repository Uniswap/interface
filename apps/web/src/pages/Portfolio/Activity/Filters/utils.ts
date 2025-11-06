import { SelectOption } from 'components/Dropdowns/DropdownSelector'
import { Box } from 'ui/src/components/icons/Box'
import { Coin } from 'ui/src/components/icons/Coin'
import { CoinConvert } from 'ui/src/components/icons/CoinConvert'
import { Lock } from 'ui/src/components/icons/Lock'
import { Minus } from 'ui/src/components/icons/Minus'
import { MoneyHand } from 'ui/src/components/icons/MoneyHand'
import { Plus } from 'ui/src/components/icons/Plus'
import { Pools } from 'ui/src/components/icons/Pools'
import { ReceiveAlt } from 'ui/src/components/icons/ReceiveAlt'
import { SendAction } from 'ui/src/components/icons/SendAction'
import { AppTFunction } from 'ui/src/i18n/types'
import { ActivityItem } from 'uniswap/src/components/activity/generateActivityItemRenderer'
import { isLoadingItem, isSectionHeader } from 'uniswap/src/components/activity/utils'
import { TransactionDetails, TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'

export enum ActivityFilterType {
  All = 'all',
  Sends = 'sends',
  Receives = 'receives',
  Swaps = 'swaps',
  Wraps = 'wraps',
  Approvals = 'approvals',
  CreatePool = 'create-pool',
  AddLiquidity = 'add-liquidity',
  RemoveLiquidity = 'remove-liquidity',
  Mints = 'mints',
  ClaimFees = 'claim-fees',
}

/**
 * Type guard to check if an ActivityItem is a TransactionDetails
 * @param item ActivityItem to check
 * @returns true if the item is a TransactionDetails
 */
function isTransactionDetails(item: ActivityItem): item is TransactionDetails {
  // Validate that the item has required TransactionDetails properties
  return (
    'typeInfo' in item && 'addedTime' in item && typeof item.typeInfo === 'object' && typeof item.addedTime === 'number'
  )
}

/**
 * Filters out loading items and section headers, leaving only TransactionDetails
 * @param transactions ActivityItems to filter
 * @returns only TransactionDetails items
 */
export function filterTransactionDetailsFromActivityItems(transactions: ActivityItem[]): TransactionDetails[] {
  return transactions.filter(
    (item): item is TransactionDetails => !isLoadingItem(item) && !isSectionHeader(item) && isTransactionDetails(item),
  )
}

export function getTransactionTypeFilterOptions(t: AppTFunction): Record<string, SelectOption> {
  return {
    [ActivityFilterType.All]: {
      label: t('portfolio.activity.filters.transactionType.all'),
      icon: null,
    },
    [ActivityFilterType.Swaps]: {
      label: t('portfolio.activity.filters.transactionType.swaps'),
      icon: CoinConvert,
    },
    [ActivityFilterType.Sends]: {
      label: t('portfolio.activity.filters.transactionType.sends'),
      icon: SendAction,
    },
    [ActivityFilterType.Receives]: {
      label: t('portfolio.activity.filters.transactionType.receives'),
      icon: ReceiveAlt,
    },
    [ActivityFilterType.Wraps]: {
      label: t('portfolio.activity.filters.transactionType.wraps'),
      icon: Box,
    },
    [ActivityFilterType.Approvals]: {
      label: t('portfolio.activity.filters.transactionType.approvals'),
      icon: Lock,
    },
    [ActivityFilterType.CreatePool]: {
      label: t('portfolio.activity.filters.transactionType.createPool'),
      icon: Pools,
    },
    [ActivityFilterType.AddLiquidity]: {
      label: t('portfolio.activity.filters.transactionType.addLiquidity'),
      icon: Plus,
    },
    [ActivityFilterType.RemoveLiquidity]: {
      label: t('portfolio.activity.filters.transactionType.removeLiquidity'),
      icon: Minus,
    },
    [ActivityFilterType.ClaimFees]: {
      label: t('portfolio.activity.filters.transactionType.claimFees'),
      icon: MoneyHand,
    },
    [ActivityFilterType.Mints]: {
      label: t('portfolio.activity.filters.transactionType.mints'),
      icon: Coin,
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
    case ActivityFilterType.Approvals:
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
