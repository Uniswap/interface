import { Trans } from '@lingui/macro'
import { Token } from '@uniswap/sdk-core'
import { useERC20PermitFromTrade } from 'hooks/useERC20Permit'
import { useUpdateAtom } from 'jotai/utils'
import { WrapErrorText } from 'lib/components/Swap/WrapErrorText'
import { useSwapCurrencyAmount, useSwapInfo, useSwapTradeType } from 'lib/hooks/swap'
import useSwapApproval, {
  ApprovalState,
  useSwapApprovalOptimizedTrade,
  useSwapRouterAddress,
} from 'lib/hooks/swap/useSwapApproval'
import { useSwapCallback } from 'lib/hooks/swap/useSwapCallback'
import useWrapCallback, { WrapError, WrapType } from 'lib/hooks/swap/useWrapCallback'
import { useAddTransaction } from 'lib/hooks/transactions'
import { usePendingApproval } from 'lib/hooks/transactions'
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
    allowedSlippage,
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

  // TODO(zzmp): Return an optimized trade directly from useSwapInfo.
  const optimizedTrade =
    // Use trade.trade if there is no swap optimized trade. This occurs if approvals are still pending.
    useSwapApprovalOptimizedTrade(trade.trade, allowedSlippage, useIsPendingApproval) || trade.trade

  const approvalCurrencyAmount = useSwapCurrencyAmount(Field.INPUT)
  const [approval, getApproval] = useSwapApproval(
    optimizedTrade,
    allowedSlippage,
    useIsPendingApproval,
    approvalCurrencyAmount
  )
  const approvalHash = usePendingApproval(
    inputCurrency?.isToken ? inputCurrency : undefined,
    useSwapRouterAddress(optimizedTrade)
  )

  const addTransaction = useAddTransaction()
  const addApprovalTransaction = useCallback(() => {
    getApproval().then((transaction) => {
      if (transaction) {
        addTransaction({ type: TransactionType.APPROVAL, ...transaction })
      }
    })
  }, [addTransaction, getApproval])

  const { type: wrapType, callback: wrapCallback, error: wrapError, loading: wrapLoading } = useWrapCallback()

  const actionProps = useMemo((): Partial<ActionButtonProps> | undefined => {
    if (disabled || wrapLoading) return { disabled: true }
    if (!disabled && chainId) {
      const hasSufficientInputForTrade =
        inputTradeCurrencyAmount && inputCurrencyBalance && !inputCurrencyBalance.lessThan(inputTradeCurrencyAmount)
      if (approval === ApprovalState.NOT_APPROVED) {
        const currency = inputCurrency || approvalCurrencyAmount?.currency
        invariant(currency)
        return {
          action: {
            message: <Trans>Approve {currency.symbol} first</Trans>,
            onClick: addApprovalTransaction,
            children: <Trans>Approve</Trans>,
          },
        }
      } else if (approval === ApprovalState.PENDING) {
        return {
          disabled: true,
          action: {
            message: (
              <EtherscanLink type={ExplorerDataType.TRANSACTION} data={approvalHash}>
                <Trans>Approval pending</Trans>
              </EtherscanLink>
            ),
            icon: Spinner,
            onClick: addApprovalTransaction,
            children: <Trans>Approve</Trans>,
          },
        }
      } else if (hasSufficientInputForTrade || (wrapType !== WrapType.NOT_APPLICABLE && !wrapError)) {
        return {}
      }
    }
    return { disabled: true }
  }, [
    addApprovalTransaction,
    approval,
    approvalCurrencyAmount?.currency,
    approvalHash,
    chainId,
    disabled,
    inputCurrency,
    inputCurrencyBalance,
    inputTradeCurrencyAmount,
    wrapError,
    wrapLoading,
    wrapType,
  ])

  const deadline = useTransactionDeadline()
  const { signatureData } = useERC20PermitFromTrade(optimizedTrade, allowedSlippage, deadline)

  // the callback to execute the swap
  const { callback: swapCallback } = useSwapCallback({
    trade: optimizedTrade,
    allowedSlippage,
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
    if (wrapError !== WrapError.NO_ERROR) {
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
          <SummaryDialog trade={activeTrade} allowedSlippage={allowedSlippage} onConfirm={onConfirm} />
        </Dialog>
      )}
    </>
  )
}
