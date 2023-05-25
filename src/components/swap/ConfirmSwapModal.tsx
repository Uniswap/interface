import { Trans } from '@lingui/macro'
import { sendAnalyticsEvent, Trace } from '@uniswap/analytics'
import { InterfaceModalName, SwapEventName, SwapPriceUpdateUserResponse } from '@uniswap/analytics-events'
import { Percent } from '@uniswap/sdk-core'
import { getPriceUpdateBasisPoints } from 'lib/utils/analytics'
import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { InterfaceTrade } from 'state/routing/types'
import { formatSwapPriceUpdatedEventProperties } from 'utils/loggingFormatters'
import { tradeMeaningfullyDiffers } from 'utils/tradeMeaningFullyDiffer'

import TransactionConfirmationModal, {
  ConfirmationModalContent,
  TransactionErrorContent,
} from '../TransactionConfirmationModal'
import SwapModalFooter from './SwapModalFooter'
import SwapModalHeader from './SwapModalHeader'

export default function ConfirmSwapModal({
  trade,
  originalTrade,
  onAcceptChanges,
  allowedSlippage,
  onConfirm,
  onDismiss,
  swapErrorMessage,
  attemptingTxn,
  txHash,
  swapQuoteReceivedDate,
  fiatValueInput,
  fiatValueOutput,
}: {
  trade: InterfaceTrade
  originalTrade?: InterfaceTrade
  attemptingTxn: boolean
  txHash?: string
  allowedSlippage: Percent
  onAcceptChanges: () => void
  onConfirm: () => void
  swapErrorMessage?: ReactNode
  onDismiss: () => void
  swapQuoteReceivedDate?: Date
  fiatValueInput: { data?: number; isLoading: boolean }
  fiatValueOutput: { data?: number; isLoading: boolean }
}) {
  const showAcceptChanges = useMemo(
    () => Boolean(originalTrade && tradeMeaningfullyDiffers(trade, originalTrade)),
    [originalTrade, trade]
  )

  const [lastExecutionPrice, setLastExecutionPrice] = useState(trade?.executionPrice)
  const [priceUpdate, setPriceUpdate] = useState<number>()
  useEffect(() => {
    if (lastExecutionPrice && !trade.executionPrice.equalTo(lastExecutionPrice)) {
      setPriceUpdate(getPriceUpdateBasisPoints(lastExecutionPrice, trade.executionPrice))
      setLastExecutionPrice(trade.executionPrice)
    }
  }, [lastExecutionPrice, setLastExecutionPrice, trade])

  const onModalDismiss = useCallback(() => {
    sendAnalyticsEvent(
      SwapEventName.SWAP_PRICE_UPDATE_ACKNOWLEDGED,
      formatSwapPriceUpdatedEventProperties(trade, priceUpdate, SwapPriceUpdateUserResponse.REJECTED)
    )
    onDismiss()
  }, [onDismiss, priceUpdate, trade])

  const modalHeader = useCallback(() => {
    return <SwapModalHeader trade={trade} allowedSlippage={allowedSlippage} />
  }, [allowedSlippage, trade])

  const modalBottom = useCallback(() => {
    return (
      <SwapModalFooter
        onConfirm={onConfirm}
        trade={trade}
        hash={txHash}
        allowedSlippage={allowedSlippage}
        disabledConfirm={showAcceptChanges}
        swapErrorMessage={swapErrorMessage}
        swapQuoteReceivedDate={swapQuoteReceivedDate}
        fiatValueInput={fiatValueInput}
        fiatValueOutput={fiatValueOutput}
        showAcceptChanges={showAcceptChanges}
        onAcceptChanges={onAcceptChanges}
      />
    )
  }, [
    trade,
    onConfirm,
    txHash,
    allowedSlippage,
    showAcceptChanges,
    swapErrorMessage,
    swapQuoteReceivedDate,
    fiatValueInput,
    fiatValueOutput,
    onAcceptChanges,
  ])

  // text to show while loading
  const pendingText = (
    <Trans>
      Swapping {trade.inputAmount.toSignificant(6)} {trade.inputAmount.currency?.symbol} for{' '}
      {trade.outputAmount.toSignificant(6)} {trade.outputAmount.currency?.symbol}
    </Trans>
  )

  const confirmationContent = useCallback(
    () =>
      swapErrorMessage ? (
        <TransactionErrorContent onDismiss={onModalDismiss} message={swapErrorMessage} />
      ) : (
        <ConfirmationModalContent
          title={<Trans>Review Swap</Trans>}
          onDismiss={onModalDismiss}
          topContent={modalHeader}
          bottomContent={modalBottom}
        />
      ),
    [onModalDismiss, modalBottom, modalHeader, swapErrorMessage]
  )

  return (
    <Trace modal={InterfaceModalName.CONFIRM_SWAP}>
      <TransactionConfirmationModal
        isOpen
        onDismiss={onModalDismiss}
        attemptingTxn={attemptingTxn}
        hash={txHash}
        content={confirmationContent}
        pendingText={pendingText}
        currencyToAdd={trade.outputAmount.currency}
      />
    </Trace>
  )
}
