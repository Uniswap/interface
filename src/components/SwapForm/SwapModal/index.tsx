import { Currency, Token } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { useState } from 'react'

import Modal from 'components/Modal'
import { useSwapFormContext } from 'components/SwapForm/SwapFormContext'
import { BuildRouteResult } from 'components/SwapForm/hooks/useBuildRoute'
import {
  ConfirmationPendingContent,
  TransactionErrorContent,
  TransactionSubmittedContent,
} from 'components/TransactionConfirmationModal'
import { useActiveWeb3React } from 'hooks'

import ConfirmSwapModalContent from './ConfirmSwapModalContent'

type Props = {
  isOpen: boolean
  tokenAddToMetaMask: Currency | undefined
  buildResult: BuildRouteResult | undefined
  isBuildingRoute: boolean

  onDismiss: () => void
  swapCallback: (() => Promise<string>) | undefined
  onRetryBuild: () => void
}

const SwapModal: React.FC<Props> = props => {
  const { isOpen, tokenAddToMetaMask, onDismiss, swapCallback, buildResult, isBuildingRoute, onRetryBuild } = props
  const { chainId } = useActiveWeb3React()

  // modal and loading
  const [{ error, isAttemptingTx, txHash }, setSwapState] = useState<{
    error: string
    isAttemptingTx: boolean
    txHash: string
  }>({
    error: '',
    isAttemptingTx: false,
    txHash: '',
  })

  const { routeSummary } = useSwapFormContext()
  const currencyIn = routeSummary?.parsedAmountIn?.currency
  const currencyOut = routeSummary?.parsedAmountOut?.currency

  // text to show while loading
  const pendingText = `Swapping ${routeSummary?.parsedAmountIn?.toSignificant(6)} ${
    currencyIn?.symbol
  } for ${routeSummary?.parsedAmountOut?.toSignificant(6)} ${currencyOut?.symbol}`

  const handleDismiss = () => {
    onDismiss()
    setSwapState({
      error: '',
      isAttemptingTx: false,
      txHash: '',
    })
  }

  const handleAttemptSendTx = () => {
    setSwapState({
      error: '',
      isAttemptingTx: true,
      txHash: '',
    })
  }

  const handleTxSubmitted = (txHash: string) => {
    setSwapState({
      error: '',
      txHash,
      isAttemptingTx: false,
    })
  }

  const handleError = (error: string) => {
    setSwapState({
      error,
      txHash: '',
      isAttemptingTx: false,
    })
  }

  const handleConfirmSwap = async () => {
    if (!swapCallback) {
      return
    }

    handleAttemptSendTx()
    try {
      const hash = await swapCallback()
      handleTxSubmitted(hash)
    } catch (e) {
      handleError(e.message || t`Something went wrong. Please try again`)
    }
  }

  const renderModalContent = () => {
    if (isAttemptingTx) {
      return <ConfirmationPendingContent onDismiss={handleDismiss} pendingText={pendingText} startedTime={undefined} />
    }

    if (txHash) {
      return (
        <TransactionSubmittedContent
          showTxBanner
          chainId={chainId}
          hash={txHash}
          onDismiss={handleDismiss}
          tokenAddToMetaMask={tokenAddToMetaMask as Token}
        />
      )
    }

    if (error) {
      return <TransactionErrorContent onDismiss={handleDismiss} message={error} />
    }

    return (
      <ConfirmSwapModalContent
        isBuildingRoute={isBuildingRoute}
        errorWhileBuildRoute={buildResult?.error}
        onDismiss={handleDismiss}
        onSwap={handleConfirmSwap}
        onRetry={onRetryBuild}
        buildResult={buildResult}
      />
    )
  }

  return (
    <Modal isOpen={isOpen} onDismiss={handleDismiss} maxHeight={90}>
      {renderModalContent()}
    </Modal>
  )
}

export default SwapModal
