import { useUpdateAtom } from 'jotai/utils'
import useWrapCallback, { WrapType } from 'lib/hooks/swap/useWrapCallback'
import { useAddTransaction } from 'lib/hooks/transactions'
import useActiveWeb3React from 'lib/hooks/useActiveWeb3React'
import { displayTxHashAtom } from 'lib/state/swap'
import { TransactionType } from 'lib/state/transactions'
import { useMemo } from 'react'

export default function useWrapData() {
  const { chainId } = useActiveWeb3React()
  const { type: wrapType, callback: wrapCallback, loading } = useWrapCallback()

  const setDisplayTxHash = useUpdateAtom(displayTxHashAtom)
  const addTransaction = useAddTransaction()

  return useMemo(() => {
    if (wrapType === WrapType.NOT_APPLICABLE) return

    const callback = async () => {
      const transaction = await wrapCallback()
      addTransaction({
        response: transaction,
        type: TransactionType.WRAP,
        unwrapped: wrapType === WrapType.UNWRAP,
        currencyAmountRaw: transaction.value?.toString() ?? '0',
        chainId,
      })
      setDisplayTxHash(transaction.hash)
    }
    return { callback, loading, type: wrapType }
  }, [addTransaction, chainId, loading, setDisplayTxHash, wrapCallback, wrapType])
}
