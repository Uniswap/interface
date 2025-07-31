import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { isUniverseChainId } from 'uniswap/src/features/chains/utils'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'

import { TransactionDetails } from 'uniswap/src/features/transactions/types/transactionDetails'
import { isInterfaceTransaction, isWalletTransaction } from 'uniswap/src/features/transactions/types/utils'
import { useWallet } from 'uniswap/src/features/wallet/hooks/useWallet'
import { UniswapState } from 'uniswap/src/state/uniswapReducer'

export function useActualCompletionTime({
  outputCurrencyInfo,
}: {
  outputCurrencyInfo: CurrencyInfo | undefined
}): number | undefined {
  // Get transaction data to calculate actual confirm time
  const chainId = outputCurrencyInfo?.currency.chainId
  const { evmAccount } = useWallet()
  const address = evmAccount?.address

  const transactions = useSelector((state: UniswapState) =>
    address && isUniverseChainId(chainId)
      ? (state.transactions[address]?.[chainId] as Record<string, TransactionDetails>)
      : undefined,
  )

  // Get the latest transaction by timestamp (most recent addedTime)
  const transaction = useMemo(() => {
    if (!transactions) {
      return undefined
    }

    const allTransactions = Object.values(transactions)
    if (allTransactions.length === 0) {
      return undefined
    }

    // Sort by addedTime descending and return the most recent
    return allTransactions.sort((a, b) => b.addedTime - a.addedTime)[0]
  }, [transactions])

  // Calculate actual confirm time using transaction timing data
  const confirmTimeSeconds = useMemo(() => {
    if (!transaction || !transaction.addedTime) {
      return undefined
    }

    let confirmedTime: number | undefined

    // Handle different transaction types
    if (isInterfaceTransaction(transaction)) {
      confirmedTime = transaction.confirmedTime
    } else if (isWalletTransaction(transaction)) {
      confirmedTime = transaction.receipt?.confirmedTime
    }

    if (!confirmedTime) {
      return undefined
    }

    const rawConfirmTime = (confirmedTime - transaction.addedTime) / 1000

    // Round to nearest 0.1
    const roundedConfirmTime = Math.round(rawConfirmTime * 10) / 10

    return roundedConfirmTime
  }, [transaction])

  return confirmTimeSeconds
}
