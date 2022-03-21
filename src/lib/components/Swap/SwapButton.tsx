import { Trans } from '@lingui/macro'
import { Token } from '@uniswap/sdk-core'
import { useUpdateAtom } from 'jotai/utils'
import { WrapErrorText } from 'lib/components/Swap/WrapErrorText'
import { useSwapCurrencyAmount, useSwapInfo } from 'lib/hooks/swap'
import useFeeOptions from 'lib/hooks/swap/useFeeOptions'
import {
  ApproveOrPermitState,
  useApproveOrPermit,
  useSwapApprovalOptimizedTrade,
  useSwapRouterAddress,
} from 'lib/hooks/swap/useSwapApproval'
import { useSwapCallback } from 'lib/hooks/swap/useSwapCallback'
import useWrapCallback, { WrapError, WrapType } from 'lib/hooks/swap/useWrapCallback'
import { useAddTransaction, usePendingApproval } from 'lib/hooks/transactions'
import useActiveWeb3React from 'lib/hooks/useActiveWeb3React'
import { useSetOldestValidBlock } from 'lib/hooks/useIsValidBlock'
import useTransactionDeadline from 'lib/hooks/useTransactionDeadline'
import { Spinner } from 'lib/icons'
import { displayTxHashAtom, Field } from 'lib/state/swap'
import { TransactionType } from 'lib/state/transactions'
import { useTheme } from 'lib/theme'
import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import invariant from 'tiny-invariant'
import { ExplorerDataType } from 'utils/getExplorerLink'

import ActionButton, { ActionButtonProps } from '../ActionButton'
import Dialog from '../Dialog'
import EtherscanLink from '../EtherscanLink'
import { SummaryDialog } from './Summary'

interface SwapButtonProps {
  disabled?: boolean
}

function useIsPendingApproval(token?: Token, spender?: string): boolean {
  return Boolean(usePendingApproval(token, spender))
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
  const [feeOptions] = useFeeOptions()

  // TODO(zzmp): Return an optimized trade directly from useSwapInfo.
  const optimizedTrade =
    // Use trade.trade if there is no swap optimized trade. This occurs if approvals are still pending.
    useSwapApprovalOptimizedTrade(trade.trade, slippage.allowed, useIsPendingApproval) || trade.trade
  const approvalCurrencyAmount = useSwapCurrencyAmount(Field.INPUT)
  const { approvalState, signatureData, handleApproveOrPermit } = useApproveOrPermit(
    optimizedTrade,
    slippage.allowed,
    useIsPendingApproval,
    approvalCurrencyAmount
  )
  const approvalHash = usePendingApproval(
    inputCurrency?.isToken ? inputCurrency : undefined,
    useSwapRouterAddress(optimizedTrade)
  )

  const addTransaction = useAddTransaction()
  const onApprove = useCallback(async () => {
    const transaction = await handleApproveOrPermit()
    if (transaction) {
      addTransaction({ type: TransactionType.APPROVAL, ...transaction })
    }
  }, [addTransaction, handleApproveOrPermit])

  const { type: wrapType, callback: wrapCallback, error: wrapError, loading: wrapLoading } = useWrapCallback()

  const disableSwap = useMemo(
    () =>
      disabled ||
      !optimizedTrade ||
      !chainId ||
      wrapLoading ||
      (wrapType !== WrapType.NOT_APPLICABLE && wrapError) ||
      !(inputCurrencyAmount && inputCurrencyBalance) ||
      inputCurrencyBalance.lessThan(inputCurrencyAmount),
    [disabled, optimizedTrade, chainId, wrapLoading, wrapType, wrapError, inputCurrencyAmount, inputCurrencyBalance]
  )

  const actionProps = useMemo((): Partial<ActionButtonProps> | undefined => {
    if (disableSwap) {
      return { disabled: true }
    }
    if (
      wrapType === WrapType.NOT_APPLICABLE &&
      (approvalState === ApproveOrPermitState.REQUIRES_APPROVAL ||
        approvalState === ApproveOrPermitState.REQUIRES_SIGNATURE)
    ) {
      const currency = inputCurrency || approvalCurrencyAmount?.currency
      invariant(currency)
      return {
        action: {
          message:
            approvalState === ApproveOrPermitState.REQUIRES_SIGNATURE ? (
              <Trans>Allow {currency.symbol} first</Trans>
            ) : (
              <Trans>Approve {currency.symbol} first</Trans>
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
  }, [approvalCurrencyAmount?.currency, approvalHash, approvalState, disableSwap, inputCurrency, onApprove, wrapType])

  const deadline = useTransactionDeadline()
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

  const [activeTrade, setActiveTrade] = useState<typeof trade.trade | undefined>()
  // If there is an active trade, keep it up-to-date.
  useEffect(() => setActiveTrade((activeTrade) => activeTrade && trade.trade), [trade])
  // Clear any active trade if the chain is changed.
  useEffect(() => setActiveTrade(undefined), [chainId])

  const setOldestValidBlock = useSetOldestValidBlock()
  const onConfirm = useCallback(async () => {
    if (!swapCallback) return

    try {
      const response = await swapCallback()
      setDisplayTxHash(response.hash)
      invariant(activeTrade)
      addTransaction({
        response,
        type: TransactionType.SWAP,
        tradeType: activeTrade.tradeType,
        inputCurrencyAmount: activeTrade.inputAmount,
        outputCurrencyAmount: activeTrade.outputAmount,
      })

      // Set the block containing the response to the oldest valid block to ensure that the
      // completed trade's impact is reflected in future fetched trades.
      response.wait(1).then((receipt) => setOldestValidBlock(receipt.blockNumber))
    } catch (error) {
      // TODO(ianlapham): add error handling
      console.log(error)
    }
    setActiveTrade(undefined)
  }, [activeTrade, addTransaction, setDisplayTxHash, setOldestValidBlock, swapCallback])

  const ButtonText = useCallback(() => {
    if ((wrapType === WrapType.WRAP || wrapType === WrapType.UNWRAP) && wrapError !== WrapError.NO_ERROR) {
      return <WrapErrorText wrapError={wrapError} />
    }
    switch (wrapType) {
      case WrapType.UNWRAP:
        return <Trans>Unwrap</Trans>
      case WrapType.WRAP:
        return <Trans>Wrap</Trans>
      case WrapType.NOT_APPLICABLE:
      default:
        return <Trans>Review swap</Trans>
    }
  }, [wrapError, wrapType])

  const { tokenColorExtraction } = useTheme()
  const handleActionButtonClick = useCallback(async () => {
    if (wrapType === WrapType.NOT_APPLICABLE) {
      setActiveTrade(trade.trade)
    } else {
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
  }, [addTransaction, chainId, setDisplayTxHash, trade.trade, wrapCallback, wrapType])
  const handleDialogClose = useCallback(() => setActiveTrade(undefined), [])

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
