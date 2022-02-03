import { Trans } from '@lingui/macro'
import { Token, TradeType } from '@uniswap/sdk-core'
import { CHAIN_INFO } from 'constants/chainInfo'
import { useERC20PermitFromTrade } from 'hooks/useERC20Permit'
import { useUpdateAtom } from 'jotai/utils'
import { useAtomValue } from 'jotai/utils'
import { useSwapInfo } from 'lib/hooks/swap'
import useSwapApproval, {
  ApprovalState,
  useSwapApprovalOptimizedTrade,
  useSwapRouterAddress,
} from 'lib/hooks/swap/useSwapApproval'
import { useSwapCallback } from 'lib/hooks/swap/useSwapCallback'
import { useAddTransaction } from 'lib/hooks/transactions'
import { usePendingApproval } from 'lib/hooks/transactions'
import useActiveWeb3React from 'lib/hooks/useActiveWeb3React'
import useTransactionDeadline from 'lib/hooks/useTransactionDeadline'
import { Link, Spinner } from 'lib/icons'
import { displayTxHashAtom, Field, independentFieldAtom } from 'lib/state/swap'
import { TransactionType } from 'lib/state/transactions'
import styled, { useTheme } from 'lib/theme'
import { useCallback, useEffect, useMemo, useState } from 'react'
import invariant from 'tiny-invariant'

import ActionButton from '../ActionButton'
import Dialog from '../Dialog'
import Row from '../Row'
import { SummaryDialog } from './Summary'

interface SwapButtonProps {
  disabled?: boolean
}

const EtherscanA = styled.a`
  color: currentColor;
  text-decoration: none;
`

function useIsPendingApproval(token?: Token, spender?: string): boolean {
  return Boolean(usePendingApproval(token, spender))
}

export default function SwapButton({ disabled }: SwapButtonProps) {
  const { account, chainId } = useActiveWeb3React()

  const { tokenColorExtraction } = useTheme()

  const {
    trade,
    allowedSlippage,
    currencies: { [Field.INPUT]: inputCurrency },
    currencyBalances: { [Field.INPUT]: inputCurrencyBalance },
    currencyAmounts: { [Field.INPUT]: inputCurrencyAmount, [Field.OUTPUT]: outputCurrencyAmount },
  } = useSwapInfo()

  const independentField = useAtomValue(independentFieldAtom)

  const [activeTrade, setActiveTrade] = useState<typeof trade.trade | undefined>()
  useEffect(() => {
    setActiveTrade((activeTrade) => activeTrade && trade.trade)
  }, [trade])

  // TODO(zzmp): Return an optimized trade directly from useSwapInfo.
  const optimizedTrade =
    // Use trade.trade if there is no swap optimized trade. This occurs if approvals are still pending.
    useSwapApprovalOptimizedTrade(trade.trade, allowedSlippage, useIsPendingApproval) || trade.trade
  const [approval, getApproval] = useSwapApproval(optimizedTrade, allowedSlippage, useIsPendingApproval)
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

  const actionProps = useMemo(() => {
    if (disabled) return { disabled: true }

    if (chainId && inputCurrencyAmount && inputCurrencyBalance?.greaterThan(inputCurrencyAmount)) {
      if (approval === ApprovalState.PENDING) {
        return {
          disabled: true,
          update: {
            message: (
              <EtherscanA href={approvalHash && `${CHAIN_INFO[chainId].explorer}tx/${approvalHash}`} target="_blank">
                <Row gap={0.25}>
                  <Trans>
                    Approval pending <Link />
                  </Trans>
                </Row>
              </EtherscanA>
            ),
            action: <Trans>Approve</Trans>,
            icon: Spinner,
          },
        }
      } else if (approval === ApprovalState.NOT_APPROVED) {
        return {
          update: {
            message: <Trans>Approve {inputCurrencyAmount.currency.symbol} first</Trans>,
            action: <Trans>Approve</Trans>,
          },
        }
      }
      return {}
    }

    return { disabled: true }
  }, [approval, approvalHash, chainId, disabled, inputCurrencyAmount, inputCurrencyBalance])

  const deadline = useTransactionDeadline()
  const { signatureData } = useERC20PermitFromTrade(optimizedTrade, allowedSlippage, deadline)

  // the callback to execute the swap
  const { callback: swapCallback } = useSwapCallback(
    optimizedTrade,
    allowedSlippage,
    account ?? null,
    signatureData,
    deadline
  )

  //@TODO(ianlapham): add a loading state, process errors
  const setDisplayTxHash = useUpdateAtom(displayTxHashAtom)

  const onConfirm = useCallback(() => {
    swapCallback?.()
      .then((response) => {
        setDisplayTxHash(response.hash)
        invariant(inputCurrencyAmount && outputCurrencyAmount)
        addTransaction({
          response,
          type: TransactionType.SWAP,
          tradeType: independentField === Field.INPUT ? TradeType.EXACT_INPUT : TradeType.EXACT_OUTPUT,
          inputCurrencyAmount,
          outputCurrencyAmount,
        })
      })
      .catch((error) => {
        //@TODO(ianlapham): add error handling
        console.log(error)
      })
  }, [addTransaction, independentField, inputCurrencyAmount, outputCurrencyAmount, setDisplayTxHash, swapCallback])

  return (
    <>
      <ActionButton
        color={tokenColorExtraction ? 'interactive' : 'accent'}
        onClick={() => setActiveTrade(trade.trade)}
        onUpdate={addApprovalTransaction}
        {...actionProps}
      >
        <Trans>Review swap</Trans>
      </ActionButton>
      {activeTrade && (
        <Dialog color="dialog" onClose={() => setActiveTrade(undefined)}>
          <SummaryDialog trade={activeTrade} allowedSlippage={allowedSlippage} onConfirm={onConfirm} />
        </Dialog>
      )}
    </>
  )
}
