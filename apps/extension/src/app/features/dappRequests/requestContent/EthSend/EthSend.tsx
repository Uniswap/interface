import type { GasFeeResult } from '@universe/api'
import { useCallback, useState } from 'react'
import { useDappLastChainId } from 'src/app/features/dapp/hooks'
import { useDappRequestQueueContext } from 'src/app/features/dappRequests/DappRequestQueueContext'
import { usePrepareAndSignEthSendTransaction } from 'src/app/features/dappRequests/hooks/usePrepareAndSignEthSendTransaction'
import { ApproveRequestContent } from 'src/app/features/dappRequests/requestContent/EthSend/Approve/ApproveRequestContent'
import { FallbackEthSendRequestContent } from 'src/app/features/dappRequests/requestContent/EthSend/FallbackEthSend/FallbackEthSend'
import { LPRequestContent } from 'src/app/features/dappRequests/requestContent/EthSend/LP/LPRequestContent'
import { ParsedTransactionRequestContent } from 'src/app/features/dappRequests/requestContent/EthSend/ParsedTransaction/ParsedTransactionRequestContent'
import { Permit2ApproveRequestContent } from 'src/app/features/dappRequests/requestContent/EthSend/Permit2Approve/Permit2ApproveRequestContent'
import { SwapRequestContent } from 'src/app/features/dappRequests/requestContent/EthSend/Swap/SwapRequestContent'
import { WrapRequestContent } from 'src/app/features/dappRequests/requestContent/EthSend/Wrap/WrapRequestContent'
import { DappRequestStoreItemForEthSendTxn } from 'src/app/features/dappRequests/slice'
import {
  isApproveRequest,
  isLPRequest,
  isPermit2ApproveRequest,
  isSwapRequest,
  isWrapRequest,
  SendTransactionRequest,
} from 'src/app/features/dappRequests/types/DappRequestTypes'
import { useEnableCustomGasFeeEntry } from 'uniswap/src/features/gas/hooks/useEnableCustomGasFeeEntry'
import type { GasFeeOverrides } from 'uniswap/src/features/gas/types'
import { TransactionTypeInfo } from 'uniswap/src/features/transactions/types/transactionDetails'
import { logger } from 'utilities/src/logger/logger'
import { ErrorBoundary } from 'wallet/src/components/ErrorBoundary/ErrorBoundary'

interface EthSendRequestContentProps {
  request: DappRequestStoreItemForEthSendTxn
}

export function EthSendRequestContent({ request }: EthSendRequestContentProps): JSX.Element {
  const { dappRequest } = request
  const { dappUrl, currentAccount, onConfirm, onCancel } = useDappRequestQueueContext()
  const chainId = useDappLastChainId(dappUrl)

  const enableCustomGasFeeEntry = useEnableCustomGasFeeEntry()
  const [gasOverrides, setGasOverrides] = useState<GasFeeOverrides | undefined>(undefined)
  // When the wallet-level setting is off, drop any in-flight overrides on the
  // floor — the user can't have set them via this surface (the chip opens the
  // auto tooltip, not the editor), but they may have toggled it off in a
  // separate window while this modal is open.
  const effectiveGasOverrides = enableCustomGasFeeEntry ? gasOverrides : undefined
  const isOverridesEligible = enableCustomGasFeeEntry

  const {
    gasFeeResult: transactionGasFeeResult,
    requestWithGasValues,
    preSignedTransaction,
  } = usePrepareAndSignEthSendTransaction({
    request,
    account: currentAccount,
    chainId,
    gasOverrides: effectiveGasOverrides,
  })

  const onConfirmRequest = useCallback(
    async (transactionTypeInfo?: TransactionTypeInfo) => {
      await onConfirm({
        request: requestWithGasValues,
        transactionTypeInfo,
        preSignedTransaction,
      })
    },
    [onConfirm, requestWithGasValues, preSignedTransaction],
  )

  const onCancelRequest = useCallback(async () => {
    await onCancel(requestWithGasValues)
  }, [onCancel, requestWithGasValues])

  // Use Blockaid transaction scanning for ALL transaction types
  // If the API fails, the ErrorBoundary will catch it and fallback to specialized UIs
  return (
    <ErrorBoundary
      fallback={
        <SpecializedTransactionFallback
          dappRequest={dappRequest}
          transactionGasFeeResult={transactionGasFeeResult}
          onCancel={onCancelRequest}
          onConfirm={onConfirmRequest}
        />
      }
      onError={(error) => {
        if (error) {
          // If we fall back to the legacy specialized UI (Blockaid threw), clear
          // any in-flight overrides — the legacy footer has no row to show them
          // through, and silently applying them to the submitted tx would be
          // confusing. Use the functional setter form to make the clear a no-op
          // when no overrides are pending; otherwise the boundary's re-catch
          // would loop forever on every render.
          setGasOverrides((prev) => (prev ? undefined : prev))
          logger.error(error, {
            tags: { file: 'EthSend', function: 'ErrorBoundary-Blockaid' },
            extra: { dappRequest, useSimulationResultUI: true },
          })
        }
      }}
    >
      <ParsedTransactionRequestContent
        dappRequest={dappRequest}
        transactionGasFeeResult={transactionGasFeeResult}
        gasOverrides={isOverridesEligible ? effectiveGasOverrides : undefined}
        // Withhold the setter from the row in Auto mode so the footer falls back
        // to <NetworkFeeFooter />. Matches mobile WC's gating pattern.
        onChangeGasOverrides={isOverridesEligible ? setGasOverrides : undefined}
        onCancel={onCancelRequest}
        onConfirm={onConfirmRequest}
      />
    </ErrorBoundary>
  )
}

/**
 * Fallback component that renders the appropriate specialized UI based on transaction type
 * Used when simulation result UI is disabled or fails
 */
function SpecializedTransactionFallback({
  dappRequest,
  transactionGasFeeResult,
  onCancel,
  onConfirm,
}: {
  dappRequest: SendTransactionRequest
  transactionGasFeeResult: GasFeeResult
  onCancel: () => Promise<void>
  onConfirm: (transactionTypeInfo?: TransactionTypeInfo) => Promise<void>
}): JSX.Element {
  switch (true) {
    case isSwapRequest(dappRequest):
      return (
        <SwapRequestContent
          parsedCalldata={dappRequest.parsedCalldata}
          transactionGasFeeResult={transactionGasFeeResult}
          onCancel={onCancel}
          onConfirm={onConfirm}
        />
      )
    case isPermit2ApproveRequest(dappRequest):
      return (
        <Permit2ApproveRequestContent
          dappRequest={dappRequest}
          transactionGasFeeResult={transactionGasFeeResult}
          onCancel={onCancel}
          onConfirm={onConfirm}
        />
      )
    case isWrapRequest(dappRequest):
      return (
        <WrapRequestContent
          dappRequest={dappRequest}
          transactionGasFeeResult={transactionGasFeeResult}
          onCancel={onCancel}
          onConfirm={onConfirm}
        />
      )
    case isLPRequest(dappRequest):
      return (
        <LPRequestContent
          dappRequest={dappRequest}
          transactionGasFeeResult={transactionGasFeeResult}
          onCancel={onCancel}
          onConfirm={onConfirm}
        />
      )
    case isApproveRequest(dappRequest):
      return (
        <ApproveRequestContent
          dappRequest={dappRequest}
          transactionGasFeeResult={transactionGasFeeResult}
          onCancel={onCancel}
          onConfirm={onConfirm}
        />
      )
    default:
      return (
        <FallbackEthSendRequestContent
          dappRequest={dappRequest}
          transactionGasFeeResult={transactionGasFeeResult}
          onCancel={onCancel}
          onConfirm={onConfirm}
        />
      )
  }
}
