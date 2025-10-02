import { SelectOption } from 'components/Dropdowns/DropdownSelector'
import { ArrowDown } from 'ui/src/components/icons/ArrowDown'
import { Coins } from 'ui/src/components/icons/Coins'
import { Dollar } from 'ui/src/components/icons/Dollar'
import { SendAction } from 'ui/src/components/icons/SendAction'
import { AppTFunction } from 'ui/src/i18n/types'

// TODO: use our existing TransactionType enum
enum TransactionType {
  All = 'all',
  Swaps = 'swaps',
  Sent = 'sent',
  Received = 'received',
  Deposits = 'deposits',
  Staking = 'staking',
}

export function getTransactionTypeFilterOptions(t: AppTFunction): Record<string, SelectOption> {
  return {
    [TransactionType.All]: {
      label: t('portfolio.activity.filters.transactionType.all'),
      icon: null,
    },
    [TransactionType.Swaps]: {
      label: t('portfolio.activity.filters.transactionType.swaps'),
      icon: Coins,
    },
    [TransactionType.Sent]: { label: t('common.sent'), icon: SendAction },
    [TransactionType.Received]: { label: t('common.received'), icon: ArrowDown },
    [TransactionType.Deposits]: {
      label: t('portfolio.activity.filters.transactionType.deposits'),
      icon: Coins,
    },
    [TransactionType.Staking]: {
      label: t('portfolio.activity.filters.transactionType.staking'),
      icon: Dollar,
    },
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
