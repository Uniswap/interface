import { Trans } from '@lingui/macro'
import { useAtomValue, useUpdateAtom } from 'jotai/utils'
import { useSwapInfo } from 'lib/hooks/swap'
import { useSwapApprovalOptimizedTrade } from 'lib/hooks/swap/useSwapApproval'
import { useSwapCallback } from 'lib/hooks/swap/useSwapCallback'
import useWrapCallback, { WrapType } from 'lib/hooks/swap/useWrapCallback'
import { useAddTransaction } from 'lib/hooks/transactions'
import useActiveWeb3React from 'lib/hooks/useActiveWeb3React'
import { useSetOldestValidBlock } from 'lib/hooks/useIsValidBlock'
import useTransactionDeadline from 'lib/hooks/useTransactionDeadline'
import { displayTxHashAtom, feeOptionsAtom, Field } from 'lib/state/swap'
import { TransactionType } from 'lib/state/transactions'
import { useTheme } from 'lib/theme'
import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import invariant from 'tiny-invariant'

import ActionButton, { ActionButtonProps } from '../../ActionButton'
import Dialog from '../../Dialog'
import { SummaryDialog } from '../Summary'
import useApprovalData, { useIsPendingApproval } from './useApprovalData'

interface SwapButtonProps {
  disabled?: boolean
}

export default memo(function SwapButton({ disabled }: SwapButtonProps) {
  const { account, chainId } = useActiveWeb3React()
  const {
    [Field.INPUT]: {
      currency: inputCurrency,
      amount: inputCurrencyAmount,
      balance: inputCurrencyBalance,
      usdc: inputUSDC,
    },
    [Field.OUTPUT]: { usdc: outputUSDC },
    trade,
    slippage,
    impact,
  } = useSwapInfo()
  const feeOptions = useAtomValue(feeOptionsAtom)

  // TODO(zzmp): Return an optimized trade directly from useSwapInfo.
  const optimizedTrade =
    // Use trade.trade if there is no swap optimized trade. This occurs if approvals are still pending.
    useSwapApprovalOptimizedTrade(trade.trade, slippage.allowed, useIsPendingApproval) || trade.trade
  const deadline = useTransactionDeadline()

  const { type: wrapType, callback: wrapCallback } = useWrapCallback()
  const { approvalData, signatureData } = useApprovalData(optimizedTrade, slippage, inputCurrencyAmount)
  const { callback: swapCallback } = useSwapCallback({
    trade: optimizedTrade,
    allowedSlippage: slippage.allowed,
    recipientAddressOrName: account ?? null,
    signatureData,
    deadline,
    feeOptions,
  })

  const [open, setOpen] = useState(false)
  // Close the review modal if there is no available trade.
  useEffect(() => setOpen((open) => (trade.trade ? open : false)), [trade.trade])
  // Close the review modal on chain change.
  useEffect(() => setOpen(false), [chainId])

  const addTransaction = useAddTransaction()
  const setDisplayTxHash = useUpdateAtom(displayTxHashAtom)
  const setOldestValidBlock = useSetOldestValidBlock()

  const onWrap = useCallback(async () => {
    try {
      const transaction = await wrapCallback?.()
      if (!transaction) return
      addTransaction({
        response: transaction,
        type: TransactionType.WRAP,
        unwrapped: wrapType === WrapType.UNWRAP,
        currencyAmountRaw: transaction.value?.toString() ?? '0',
        chainId,
      })
      setDisplayTxHash(transaction.hash)
    } catch (e) {
      // TODO(zzmp): Surface errors from wrap.
      console.log(e)
    }
  }, [addTransaction, chainId, setDisplayTxHash, wrapCallback, wrapType])
  const onSwap = useCallback(async () => {
    try {
      const transaction = await swapCallback?.()
      if (!transaction) return
      invariant(trade.trade)
      addTransaction({
        response: transaction,
        type: TransactionType.SWAP,
        tradeType: trade.trade.tradeType,
        inputCurrencyAmount: trade.trade.inputAmount,
        outputCurrencyAmount: trade.trade.outputAmount,
      })
      setDisplayTxHash(transaction.hash)
      setOpen(false)

      // Set the block containing the response to the oldest valid block to ensure that the
      // completed trade's impact is reflected in future fetched trades.
      transaction.wait(1).then((receipt) => {
        setOldestValidBlock(receipt.blockNumber)
      })
    } catch (e) {
      // TODO(zzmp): Surface errors from swap.
      console.log(e)
    }
  }, [addTransaction, setDisplayTxHash, setOldestValidBlock, swapCallback, trade.trade])

  const disableSwap = useMemo(
    () =>
      disabled ||
      !chainId ||
      (wrapType === WrapType.NONE && !optimizedTrade) ||
      !(inputCurrencyAmount && inputCurrencyBalance) ||
      inputCurrencyBalance.lessThan(inputCurrencyAmount),
    [disabled, wrapType, optimizedTrade, chainId, inputCurrencyAmount, inputCurrencyBalance]
  )
  const actionProps = useMemo((): Partial<ActionButtonProps> | undefined => {
    if (disableSwap) {
      return { disabled: true }
    } else if (wrapType === WrapType.NONE) {
      return approvalData || { onClick: () => setOpen(true) }
    } else {
      return { onClick: onWrap }
    }
  }, [approvalData, disableSwap, onWrap, wrapType])
  const Label = useCallback(() => {
    switch (wrapType) {
      case WrapType.UNWRAP:
        return <Trans>Unwrap {inputCurrency?.symbol}</Trans>
      case WrapType.WRAP:
        return <Trans>Wrap {inputCurrency?.symbol}</Trans>
      case WrapType.NONE:
      default:
        return <Trans>Review swap</Trans>
    }
  }, [inputCurrency?.symbol, wrapType])
  const onClose = useCallback(() => setOpen(false), [])

  const { tokenColorExtraction } = useTheme()
  return (
    <>
      <ActionButton color={tokenColorExtraction ? 'interactive' : 'accent'} {...actionProps}>
        <Label />
      </ActionButton>
      {open && trade.trade && (
        <Dialog color="dialog" onClose={onClose}>
          <SummaryDialog
            trade={trade.trade}
            slippage={slippage}
            inputUSDC={inputUSDC}
            outputUSDC={outputUSDC}
            impact={impact}
            onConfirm={onSwap}
          />
        </Dialog>
      )}
    </>
  )
})
