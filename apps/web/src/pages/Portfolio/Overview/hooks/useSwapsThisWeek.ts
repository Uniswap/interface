import {
  ActivityFilterType,
  filterTransactionDetailsFromActivityItems,
  getTransactionTypesForFilter,
} from 'pages/Portfolio/Activity/Filters/utils'
import { usePortfolioAddresses } from 'pages/Portfolio/hooks/usePortfolioAddresses'
import { useMemo } from 'react'
import { ActivityItem } from 'uniswap/src/components/activity/generateActivityItemRenderer'
import { useActivityData } from 'uniswap/src/features/activity/hooks/useActivityData'
import { TransactionDetails } from 'uniswap/src/features/transactions/types/transactionDetails'
import { ONE_DAY_MS } from 'utilities/src/time/time'
import { filterDefinedWalletAddresses } from 'utils/filterDefinedWalletAddresses'

function filterSwapsTypeLast7Days(transactions: ActivityItem[]): TransactionDetails[] {
  const allowedTypes = getTransactionTypesForFilter(ActivityFilterType.Swaps)
  const now = Date.now()
  const sevenDaysAgo = now - 7 * ONE_DAY_MS

  return filterTransactionDetailsFromActivityItems(transactions)
    .filter((tx: TransactionDetails) => allowedTypes !== 'all' && allowedTypes.includes(tx.typeInfo.type))
    .filter((tx: TransactionDetails) => tx.addedTime >= sevenDaysAgo)
}

export function useSwapsThisWeek() {
  const { evmAddress, svmAddress } = usePortfolioAddresses()

  const { sectionData, isLoading } = useActivityData({
    evmOwner: evmAddress,
    svmOwner: svmAddress,
    ownerAddresses: filterDefinedWalletAddresses([evmAddress, svmAddress]),
    fiatOnRampParams: undefined,
  })

  const swapsLast7Days = useMemo(() => (sectionData ? filterSwapsTypeLast7Days(sectionData) : []), [sectionData])

  const totalVolumeUSD = useMemo(
    () =>
      swapsLast7Days.reduce((sum, tx) => {
        // Note: transactedUSDValue is only populated for GraphQL transactions
        // REST API transactions don't provide USD values, so this will be 0
        const usdValue = tx.typeInfo.transactedUSDValue ?? 0
        return sum + usdValue
      }, 0),
    [swapsLast7Days],
  )

  return { count: swapsLast7Days.length, totalVolumeUSD, isLoading }
}
