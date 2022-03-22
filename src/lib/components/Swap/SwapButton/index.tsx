import { Trans } from '@lingui/macro'
import { useAtomValue, useUpdateAtom } from 'jotai/utils'
import { useSwapCurrency, useSwapInfo, useSwapTradeType } from 'lib/hooks/swap'
import { ApproveOrPermitState, useSwapApprovalOptimizedTrade } from 'lib/hooks/swap/useSwapApproval'
import { useSwapCallback } from 'lib/hooks/swap/useSwapCallback'
import useWrapCallback, { WrapType } from 'lib/hooks/swap/useWrapCallback'
import { useAddTransaction } from 'lib/hooks/transactions'
import useActiveWeb3React from 'lib/hooks/useActiveWeb3React'
import { useSetOldestValidBlock } from 'lib/hooks/useIsValidBlock'
import useTransactionDeadline from 'lib/hooks/useTransactionDeadline'
import { Spinner } from 'lib/icons'
import { displayTxHashAtom, feeOptionsAtom, Field } from 'lib/state/swap'
import { TransactionType } from 'lib/state/transactions'
import { useTheme } from 'lib/theme'
import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import invariant from 'tiny-invariant'
import { ExplorerDataType } from 'utils/getExplorerLink'

import ActionButton, { ActionButtonProps } from '../../ActionButton'
import Dialog from '../../Dialog'
import EtherscanLink from '../../EtherscanLink'
import { SummaryDialog } from '../Summary'
import useApprovalData, { useIsPendingApproval } from './useApprovalData'

interface SwapButtonProps {
  disabled?: boolean
}

export default memo(function SwapButton({ disabled }: SwapButtonProps) {
  const { account, chainId } = useActiveWeb3React()

  const { tokenColorExtraction } = useTheme()

  const {
    [Field.INPUT]: {
      currency: inputCurrency,
      amount: inputCurrencyAmount,
      balance: inputCurrencyBalance,
      usdc: inputUSDC,
    },
    [Field.OUTPUT]: { amount: outputCurrencyAmount, usdc: outputUSDC },
    trade,
    slippage,
    impact,
  } = useSwapInfo()
  const feeOptions = useAtomValue(feeOptionsAtom)

  const tradeType = useSwapTradeType()

  const [activeTrade, setActiveTrade] = useState<typeof trade.trade | undefined>()
  useEffect(() => {
    setActiveTrade((activeTrade) => activeTrade && trade.trade)
  }, [trade])

  // clear active trade on chain change
  useEffect(() => {
    setActiveTrade(undefined)
  }, [chainId])

  // TODO(zzmp): Return an optimized trade directly from useSwapInfo.
  const optimizedTrade =
    // Use trade.trade if there is no swap optimized trade. This occurs if approvals are still pending.
    useSwapApprovalOptimizedTrade(trade.trade, slippage.allowed, useIsPendingApproval) || trade.trade

  const addTransaction = useAddTransaction()
  const { type: wrapType, callback: wrapCallback } = useWrapCallback()
  const { approvalState, signatureData, onApprove, approvalHash } = useApprovalData(optimizedTrade, slippage)

  const disableSwap = useMemo(
    () =>
      disabled ||
      (wrapType === WrapType.NONE && !optimizedTrade) ||
      !chainId ||
      !(inputCurrencyAmount && inputCurrencyBalance) ||
      inputCurrencyBalance.lessThan(inputCurrencyAmount),
    [disabled, wrapType, optimizedTrade, chainId, inputCurrencyAmount, inputCurrencyBalance]
  )

  const [approvalCurrency] = useSwapCurrency(Field.INPUT)
  const actionProps = useMemo((): Partial<ActionButtonProps> | undefined => {
    if (disableSwap) return { disabled: true }

    if (
      wrapType === WrapType.NONE &&
      (approvalState === ApproveOrPermitState.REQUIRES_APPROVAL ||
        approvalState === ApproveOrPermitState.REQUIRES_SIGNATURE) &&
      approvalCurrency
    ) {
      return {
        action: {
          message:
            approvalState === ApproveOrPermitState.REQUIRES_SIGNATURE ? (
              <Trans>Allow {approvalCurrency.symbol} first</Trans>
            ) : (
              <Trans>Approve {approvalCurrency.symbol} first</Trans>
            ),
          onClick: onApprove,
          children:
            approvalState === ApproveOrPermitState.REQUIRES_SIGNATURE ? <Trans>Allow</Trans> : <Trans>Approve</Trans>,
        },
      }
    }
    if (approvalState === ApproveOrPermitState.PENDING_APPROVAL) {
      return {
        disabled: true,
        action: {
          message: (
            <EtherscanLink type={ExplorerDataType.TRANSACTION} data={approvalHash}>
              <Trans>Approval pending</Trans>
            </EtherscanLink>
          ),
          icon: Spinner,
          children: <Trans>Approve</Trans>,
        },
      }
    }
    if (approvalState === ApproveOrPermitState.PENDING_SIGNATURE) {
      return {
        disabled: true,
        action: {
          message: <Trans>Allowance pending</Trans>,
          icon: Spinner,
          children: <Trans>Allow</Trans>,
        },
      }
    }
    return {}
  }, [approvalCurrency, approvalHash, approvalState, disableSwap, onApprove, wrapType])

  const deadline = useTransactionDeadline()

  // the callback to execute the swap
  const { callback: swapCallback } = useSwapCallback({
    trade: optimizedTrade,
    allowedSlippage: slippage.allowed,
    recipientAddressOrName: account ?? null,
    signatureData,
    deadline,
    feeOptions,
  })

  //@TODO(ianlapham): add a loading state, process errors
  const setDisplayTxHash = useUpdateAtom(displayTxHashAtom)

  const setOldestValidBlock = useSetOldestValidBlock()
  const onConfirm = useCallback(() => {
    swapCallback?.()
      .then((response) => {
        setDisplayTxHash(response.hash)
        invariant(inputCurrencyAmount && outputCurrencyAmount)
        addTransaction({
          response,
          type: TransactionType.SWAP,
          tradeType,
          inputCurrencyAmount,
          outputCurrencyAmount,
        })

        // Set the block containing the response to the oldest valid block to ensure that the
        // completed trade's impact is reflected in future fetched trades.
        response.wait(1).then((receipt) => {
          setOldestValidBlock(receipt.blockNumber)
        })
      })
      .catch((error) => {
        //@TODO(ianlapham): add error handling
        console.log(error)
      })
      .finally(() => {
        setActiveTrade(undefined)
      })
  }, [
    addTransaction,
    inputCurrencyAmount,
    outputCurrencyAmount,
    setDisplayTxHash,
    setOldestValidBlock,
    swapCallback,
    tradeType,
  ])

  const ButtonText = useCallback(() => {
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

  const handleDialogClose = useCallback(() => {
    setActiveTrade(undefined)
  }, [])

  const handleActionButtonClick = useCallback(async () => {
    if (wrapType === WrapType.NONE) {
      setActiveTrade(trade.trade)
    } else {
      const transaction = await wrapCallback()
      if (!transaction) return

      addTransaction({
        response: transaction,
        type: TransactionType.WRAP,
        unwrapped: wrapType === WrapType.UNWRAP,
        currencyAmountRaw: transaction.value?.toString() ?? '0',
        chainId,
      })
      setDisplayTxHash(transaction.hash)
    }
  }, [addTransaction, chainId, setDisplayTxHash, trade.trade, wrapCallback, wrapType])

  return (
    <>
      <ActionButton
        color={tokenColorExtraction ? 'interactive' : 'accent'}
        onClick={handleActionButtonClick}
        {...actionProps}
      >
        <ButtonText />
      </ActionButton>
      {activeTrade && (
        <Dialog color="dialog" onClose={handleDialogClose}>
          <SummaryDialog
            trade={activeTrade}
            slippage={slippage}
            inputUSDC={inputUSDC}
            outputUSDC={outputUSDC}
            impact={impact}
            onConfirm={onConfirm}
          />
        </Dialog>
      )}
    </>
  )
})
