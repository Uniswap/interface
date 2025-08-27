import { Activity } from 'components/AccountDrawer/MiniPortfolio/Activity/types'
import { FLASHBLOCKS_INSTANT_BALANCE_TIMEOUT } from 'uniswap/src/features/transactions/swap/components/UnichainInstantBalanceModal/constants'
import { isNonInstantFlashblockTransactionType } from 'uniswap/src/features/transactions/swap/components/UnichainInstantBalanceModal/utils'
import { useIsUnichainFlashblocksEnabled } from 'uniswap/src/features/transactions/swap/hooks/useIsUnichainFlashblocksEnabled'
import { InterfaceTransactionDetails } from 'uniswap/src/features/transactions/types/transactionDetails'

export function useIsRecentFlashblocksNotification({
  transaction,
  activity,
}: {
  transaction: InterfaceTransactionDetails | undefined
  activity: Activity | undefined
}): boolean {
  const isFlashblocksEnabled = useIsUnichainFlashblocksEnabled(activity?.chainId)
  if (!isFlashblocksEnabled || !transaction || isNonInstantFlashblockTransactionType(transaction)) {
    return false
  }

  const { addedTime } = transaction
  const confirmedTime = transaction.receipt?.confirmedTime
  if (!addedTime) {
    return false
  }

  if (!confirmedTime) {
    return Date.now() - addedTime < FLASHBLOCKS_INSTANT_BALANCE_TIMEOUT
  }

  return confirmedTime - addedTime < FLASHBLOCKS_INSTANT_BALANCE_TIMEOUT
}
