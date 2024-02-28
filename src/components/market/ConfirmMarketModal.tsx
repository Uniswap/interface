import { Trans } from '@lingui/macro'
import { Currency, CurrencyAmount, Percent, Token, TradeType } from '@uniswap/sdk-core'
import { Trade as V2Trade } from '@uniswap/v2-sdk'
import { Trade as V3Trade } from '@uniswap/v3-sdk'
import { ReactNode, useCallback, useMemo } from 'react'
import { SwapTransaction } from 'state/validator/types'

import TransactionConfirmationModal, {
  ConfirmationModalContent,
  TransactionErrorContent,
  TransactionPreparingContent,
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
  paymentToken,
  paymentFees,
  priceImpactHigh,
  feeImpactHigh,
  updateFeeImpact,
  updatePriceImpact,
  priceImpactAccepted,
  feeImpactAccepted,
  routeIsNotFound,
  quoteErrorMessage,
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
  paymentToken: Token | undefined | null
  paymentFees: CurrencyAmount<Currency> | undefined
  priceImpactHigh: boolean
  feeImpactHigh: boolean
  updateFeeImpact: () => void
  updatePriceImpact: () => void
  priceImpactAccepted: boolean
  feeImpactAccepted: boolean
  routeIsNotFound: boolean
  quoteErrorMessage: string | undefined
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
        paymentToken={paymentToken}
        paymentFees={paymentFees}
        priceImpactHigh={priceImpactHigh}
        feeImpactHigh={feeImpactHigh}
        updateFeeImpact={updateFeeImpact}
        updatePriceImpact={updatePriceImpact}
        priceImpactAccepted={priceImpactAccepted}
        feeImpactAccepted={feeImpactAccepted}
      />
    ) : null
  }, [
    allowedSlippage,
    feeImpactAccepted,
    feeImpactHigh,
    onAcceptChanges,
    paymentFees,
    paymentToken,
    priceImpactAccepted,
    priceImpactHigh,
    recipient,
    referer,
    showAcceptChanges,
    trade,
    updateFeeImpact,
    updatePriceImpact,
  ])

  const modalBottom = useCallback(() => {
    return trade ? (
      <MarketModalFooter
        onConfirm={onConfirm}
        trade={trade}
        disabledConfirm={
          showAcceptChanges || (priceImpactHigh && !priceImpactAccepted) || (!feeImpactAccepted && feeImpactHigh)
        }
        swapErrorMessage={swapErrorMessage}
      />
    ) : null
  }, [
    feeImpactAccepted,
    feeImpactHigh,
    onConfirm,
    priceImpactAccepted,
    priceImpactHigh,
    showAcceptChanges,
    swapErrorMessage,
    trade,
  ])

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
      ) : swapTransaction?.data ? (
        <ConfirmationModalContent
          title={<Trans>Confirm Swap</Trans>}
          onDismiss={onDismiss}
          topContent={modalHeader}
          bottomContent={modalBottom}
        />
      ) : (
        <TransactionPreparingContent
          onDismiss={onDismiss}
          routeIsNotFound={routeIsNotFound}
          errorMessage={quoteErrorMessage}
        />
      ),
    [modalBottom, modalHeader, onDismiss, routeIsNotFound, swapErrorMessage, swapTransaction?.data, quoteErrorMessage]
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
