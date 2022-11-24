import { Currency } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { useCallback, useEffect, useMemo, useState } from 'react'

import TransactionConfirmationModal, {
  ConfirmationModalContent,
  TransactionErrorContent,
} from 'components/TransactionConfirmationModal'
import { useActiveWeb3React } from 'hooks'
import { useEncodeSolana, useSwapState } from 'state/swap/hooks'
import { Aggregator } from 'utils/aggregator'
import { useCurrencyConvertedToNative } from 'utils/dmm'

import SwapModalFooter from './SwapModalFooter'
import SwapModalHeader from './SwapModalHeader'

/**
 * Returns true if the trade requires a confirmation of details before we can submit it
 * @param tradeA trade A
 * @param tradeB trade B
 */
function tradeMeaningfullyDiffers(tradeA: Aggregator, tradeB: Aggregator): boolean {
  return (
    tradeA.tradeType !== tradeB.tradeType ||
    !tradeA.inputAmount.currency.equals(tradeB.inputAmount.currency) ||
    !tradeA.inputAmount.equalTo(tradeB.inputAmount) ||
    !tradeA.outputAmount.currency.equals(tradeB.outputAmount.currency) ||
    !tradeA.outputAmount.equalTo(tradeB.outputAmount)
  )
}

export default function ConfirmSwapModal({
  trade,
  originalTrade,
  onAcceptChanges,
  allowedSlippage,
  onConfirm,
  onDismiss,
  recipient,
  swapErrorMessage,
  isOpen,
  attemptingTxn,
  txHash,
  tokenAddToMetaMask,
  showTxBanner,
}: {
  isOpen: boolean
  trade: Aggregator | undefined
  originalTrade: Aggregator | undefined
  attemptingTxn: boolean
  txHash: string | undefined
  recipient: string | null
  allowedSlippage: number
  tokenAddToMetaMask: Currency | undefined
  onAcceptChanges: () => void
  onConfirm: () => void
  swapErrorMessage: string | undefined
  onDismiss: () => void
  showTxBanner?: boolean
}) {
  const { isSolana } = useActiveWeb3React()
  const { feeConfig, typedValue } = useSwapState()
  const [startedTime, setStartedTime] = useState<number | undefined>(undefined)
  const [encodeSolana] = useEncodeSolana()

  useEffect(() => {
    if (isSolana && encodeSolana) setStartedTime(Date.now())
    else setStartedTime(undefined)
  }, [encodeSolana, isOpen, isSolana])

  const showAcceptChanges = useMemo(
    () => Boolean(trade && originalTrade && tradeMeaningfullyDiffers(trade, originalTrade)),
    [originalTrade, trade],
  )

  const modalHeader = useCallback(() => {
    return trade ? (
      <SwapModalHeader
        trade={trade}
        allowedSlippage={allowedSlippage}
        recipient={recipient}
        showAcceptChanges={showAcceptChanges}
        onAcceptChanges={onAcceptChanges}
      />
    ) : null
  }, [allowedSlippage, onAcceptChanges, recipient, showAcceptChanges, trade])

  const modalBottom = useCallback(() => {
    return trade ? (
      <SwapModalFooter
        onConfirm={onConfirm}
        trade={trade}
        disabledConfirm={showAcceptChanges || (isSolana && !encodeSolana)}
        swapErrorMessage={swapErrorMessage}
        allowedSlippage={allowedSlippage}
        feeConfig={feeConfig}
        startedTime={startedTime}
      />
    ) : null
  }, [
    allowedSlippage,
    onConfirm,
    showAcceptChanges,
    swapErrorMessage,
    trade,
    feeConfig,
    isSolana,
    startedTime,
    encodeSolana,
  ])

  const nativeInput = useCurrencyConvertedToNative(originalTrade?.inputAmount?.currency)
  const nativeOutput = useCurrencyConvertedToNative(originalTrade?.outputAmount?.currency)
  // text to show while loading
  const pendingText = `Swapping ${!!feeConfig ? typedValue : originalTrade?.inputAmount?.toSignificant(6)} ${
    nativeInput?.symbol
  } for ${originalTrade?.outputAmount?.toSignificant(6)} ${nativeOutput?.symbol}`

  const confirmationContent = useCallback(
    () =>
      swapErrorMessage ? (
        <TransactionErrorContent onDismiss={onDismiss} message={swapErrorMessage} />
      ) : (
        <ConfirmationModalContent
          title={t`Confirm Swap`}
          onDismiss={onDismiss}
          topContent={modalHeader}
          bottomContent={modalBottom}
        />
      ),
    [onDismiss, modalBottom, modalHeader, swapErrorMessage],
  )

  return (
    <TransactionConfirmationModal
      isOpen={isOpen}
      onDismiss={onDismiss}
      attemptingTxn={attemptingTxn}
      hash={txHash}
      content={confirmationContent}
      pendingText={pendingText}
      tokenAddToMetaMask={tokenAddToMetaMask}
      showTxBanner={showTxBanner}
      startedTime={startedTime}
    />
  )
}
