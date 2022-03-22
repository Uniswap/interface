import { SignatureData } from 'hooks/useERC20Permit'
import { useUpdateAtom } from 'jotai/utils'
import useFeeOptions from 'lib/hooks/swap/useFeeOptions'
import { useSwapApprovalOptimizedTrade } from 'lib/hooks/swap/useSwapApproval'
import { useSwapCallback } from 'lib/hooks/swap/useSwapCallback'
import { useAddTransaction } from 'lib/hooks/transactions'
import useActiveWeb3React from 'lib/hooks/useActiveWeb3React'
import { useSetOldestValidBlock } from 'lib/hooks/useIsValidBlock'
import { Slippage } from 'lib/hooks/useSlippage'
import useTransactionDeadline from 'lib/hooks/useTransactionDeadline'
import { displayTxHashAtom } from 'lib/state/swap'
import { TransactionType } from 'lib/state/transactions'
import { useMemo } from 'react'
import invariant from 'tiny-invariant'

export default function useSwapData(
  trade: ReturnType<typeof useSwapApprovalOptimizedTrade>,
  slippage: Slippage,
  signatureData?: SignatureData
): (() => Promise<void>) | undefined {
  const { account } = useActiveWeb3React()
  const deadline = useTransactionDeadline()
  const [feeOptions] = useFeeOptions()
  const { callback: swapCallback } = useSwapCallback({
    trade,
    allowedSlippage: slippage.allowed,
    recipientAddressOrName: account ?? null,
    signatureData,
    deadline,
    feeOptions,
  })

  //@TODO(ianlapham): add a loading state, process errors
  const setDisplayTxHash = useUpdateAtom(displayTxHashAtom)
  const addTransaction = useAddTransaction()
  const setOldestValidBlock = useSetOldestValidBlock()

  return useMemo(() => {
    if (!swapCallback) return

    return async () => {
      if (!swapCallback) return

      try {
        const response = await swapCallback()
        invariant(trade)
        addTransaction({
          response,
          type: TransactionType.SWAP,
          tradeType: trade.tradeType,
          inputCurrencyAmount: trade.inputAmount,
          outputCurrencyAmount: trade.outputAmount,
        })
        setDisplayTxHash(response.hash)

        // Set the block containing the response to the oldest valid block to ensure that the
        // completed trade's impact is reflected in future fetched trades.
        response.wait(1).then((receipt) => setOldestValidBlock(receipt.blockNumber))
      } catch (error) {
        // TODO(ianlapham): add error handling
        console.log(error)
      }
    }
  }, [addTransaction, setDisplayTxHash, setOldestValidBlock, swapCallback, trade])
}
