import { Trans } from '@lingui/macro'
import { Currency, Percent, TradeType } from '@uniswap/sdk-core'
import { Trade as V2Trade } from '@uniswap/v2-sdk'
import { Trade as V3Trade } from '@uniswap/v3-sdk'
import { ReactNode, useCallback, useMemo } from 'react'
import { SwapTransaction } from 'state/validator/types'

import TransactionConfirmationModal, {
  ConfirmationModalContent,
  TransactionErrorContent,
} from '../TransactionConfirmationModal'
import MarketModalFooter from './MarketModalFooter'
import MarketModalHeader from './MarketModalHeader'

/**
 * Returns true if the trade requires a confirmation of details before we can submit it
 * @param args either a pair of V2 trades or a pair of V3 trades
 */
function tradeMeaningfullyDiffers(
  ...args:
    | [V2Trade<Currency, Currency, TradeType>, V2Trade<Currency, Currency, TradeType>]
    | [V3Trade<Currency, Currency, TradeType>, V3Trade<Currency, Currency, TradeType>]
): boolean {
  const [tradeA, tradeB] = args
  return (
    tradeA.tradeType !== tradeB.tradeType ||
    !tradeA.inputAmount.currency.equals(tradeB.inputAmount.currency) ||
    !tradeA.inputAmount.equalTo(tradeB.inputAmount) ||
    !tradeA.outputAmount.currency.equals(tradeB.outputAmount.currency) ||
    !tradeA.outputAmount.equalTo(tradeB.outputAmount)
  )
}

export default function ConfirmMarketModal({
  trade,
  originalTrade,
  swapTransaction,
  originalSwapTransaction,
  onAcceptChanges,
  allowedSlippage,
  onConfirm,
  onDismiss,
  recipient,
  swapErrorMessage,
  isOpen,
  attemptingTxn,
  txHash,
  referer,
}: {
  isOpen: boolean
  trade: V2Trade<Currency, Currency, TradeType> | V3Trade<Currency, Currency, TradeType> | undefined
  originalTrade: V2Trade<Currency, Currency, TradeType> | V3Trade<Currency, Currency, TradeType> | undefined
  swapTransaction: SwapTransaction | undefined
  originalSwapTransaction: SwapTransaction | undefined
  attemptingTxn: boolean
  txHash: string | undefined
  recipient: string | null
  allowedSlippage: Percent
  onAcceptChanges: () => void
  onConfirm: () => void
  swapErrorMessage: ReactNode | undefined
  onDismiss: () => void
  referer: string | null
}) {
  const showAcceptChanges = useMemo(
    () =>
      Boolean(
        (trade instanceof V2Trade &&
          originalTrade instanceof V2Trade &&
          tradeMeaningfullyDiffers(trade, originalTrade)) ||
          (trade instanceof V3Trade &&
            originalTrade instanceof V3Trade &&
            tradeMeaningfullyDiffers(trade, originalTrade))
      ),
    [originalTrade, trade]
  )

  const showTransactionInfo = useMemo(
    () => Boolean(originalSwapTransaction?.data || (!originalSwapTransaction?.data && swapTransaction?.data)),
    [originalSwapTransaction?.data, swapTransaction?.data]
  )

  const modalHeader = useCallback(() => {
    return trade ? (
      <MarketModalHeader
        trade={trade}
        allowedSlippage={allowedSlippage}
        recipient={recipient}
        showAcceptChanges={showAcceptChanges}
        onAcceptChanges={onAcceptChanges}
        referer={referer}
      />
    ) : null
  }, [allowedSlippage, onAcceptChanges, recipient, referer, showAcceptChanges, trade])

  const modalBottom = useCallback(() => {
    return trade ? (
      <MarketModalFooter
        onConfirm={onConfirm}
        trade={trade}
        disabledConfirm={showAcceptChanges || !showTransactionInfo}
        swapErrorMessage={swapErrorMessage}
      />
    ) : null
  }, [onConfirm, showAcceptChanges, showTransactionInfo, swapErrorMessage, trade])

  // text to show while loading
  const pendingText = (
    <Trans>
      Swapping {trade?.inputAmount?.toSignificant(6)} {trade?.inputAmount?.currency?.symbol} for{' '}
      {trade?.outputAmount?.toSignificant(6)} {trade?.outputAmount?.currency?.symbol}
    </Trans>
  )

  const confirmationContent = useCallback(
    () =>
      swapErrorMessage ? (
        <TransactionErrorContent onDismiss={onDismiss} message={swapErrorMessage} />
      ) : (
        <ConfirmationModalContent
          title={<Trans>Confirm Swap</Trans>}
          onDismiss={onDismiss}
          topContent={modalHeader}
          bottomContent={modalBottom}
        />
      ),
    [swapErrorMessage, onDismiss, modalHeader, modalBottom]
  )

  return (
    <TransactionConfirmationModal
      isOpen={isOpen}
      onDismiss={onDismiss}
      attemptingTxn={attemptingTxn}
      hash={txHash}
      content={confirmationContent}
      pendingText={pendingText}
      currencyToAdd={trade?.outputAmount.currency}
    />
  )
}
