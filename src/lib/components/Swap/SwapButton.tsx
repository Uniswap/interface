import { Trans } from '@lingui/macro'
import { Token } from '@uniswap/sdk-core'
import { useUpdateAtom } from 'jotai/utils'
import { WrapErrorText } from 'lib/components/Swap/WrapErrorText'
import { useSwapCurrencyAmount, useSwapInfo, useSwapTradeType } from 'lib/hooks/swap'
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
import useTransactionDeadline from 'lib/hooks/useTransactionDeadline'
import { Spinner } from 'lib/icons'
import { displayTxHashAtom, Field } from 'lib/state/swap'
import { TransactionType } from 'lib/state/transactions'
import { useTheme } from 'lib/theme'
import { useCallback, useEffect, useMemo, useState } from 'react'
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

export default function SwapButton({ disabled }: SwapButtonProps) {
  const { account, chainId } = useActiveWeb3React()

  const { tokenColorExtraction } = useTheme()

  const {
    slippage,
    currencies: { [Field.INPUT]: inputCurrency },
    currencyBalances: { [Field.INPUT]: inputCurrencyBalance },
    feeOptions,
    trade,
    tradeCurrencyAmounts: { [Field.INPUT]: inputTradeCurrencyAmount, [Field.OUTPUT]: outputTradeCurrencyAmount },
  } = useSwapInfo()

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
  const onApprove = useCallback(() => {
    handleApproveOrPermit().then((transaction) => {
      if (transaction) {
        addTransaction({ type: TransactionType.APPROVAL, ...transaction })
      }
    })
  }, [addTransaction, handleApproveOrPermit])

  const { type: wrapType, callback: wrapCallback, error: wrapError, loading: wrapLoading } = useWrapCallback()

  const disableSwap = useMemo(
    () =>
      disabled ||
      !chainId ||
      wrapLoading ||
      (wrapType !== WrapType.NOT_APPLICABLE && wrapError) ||
      approvalState === ApproveOrPermitState.PENDING_SIGNATURE ||
      !(inputTradeCurrencyAmount && inputCurrencyBalance) ||
      inputCurrencyBalance.lessThan(inputTradeCurrencyAmount),
    [disabled, chainId, wrapLoading, wrapType, wrapError, approvalState, inputTradeCurrencyAmount, inputCurrencyBalance]
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
          onClick: () => void 0, // @TODO: should not require an onclick
          children: <Trans>Approve</Trans>,
        },
      }
    }
    return {}
  }, [approvalCurrencyAmount?.currency, approvalHash, approvalState, disableSwap, inputCurrency, onApprove, wrapType])

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

  const onConfirm = useCallback(() => {
    swapCallback?.()
      .then((response) => {
        setDisplayTxHash(response.hash)
        invariant(inputTradeCurrencyAmount && outputTradeCurrencyAmount)
        addTransaction({
          response,
          type: TransactionType.SWAP,
          tradeType,
          inputCurrencyAmount: inputTradeCurrencyAmount,
          outputCurrencyAmount: outputTradeCurrencyAmount,
        })
      })
      .catch((error) => {
        //@TODO(ianlapham): add error handling
        console.log(error)
      })
      .finally(() => {
        setActiveTrade(undefined)
      })
  }, [addTransaction, inputTradeCurrencyAmount, outputTradeCurrencyAmount, setDisplayTxHash, swapCallback, tradeType])

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

  const handleDialogClose = useCallback(() => {
    setActiveTrade(undefined)
  }, [])

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
          <SummaryDialog trade={activeTrade} slippage={slippage} onConfirm={onConfirm} />
        </Dialog>
      )}
    </>
  )
}
