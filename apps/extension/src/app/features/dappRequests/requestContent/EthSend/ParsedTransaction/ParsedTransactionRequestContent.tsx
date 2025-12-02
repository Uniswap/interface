import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDappLastChainId } from 'src/app/features/dapp/hooks'
import { DappRequestContent } from 'src/app/features/dappRequests/DappRequestContent'
import { useDappRequestQueueContext } from 'src/app/features/dappRequests/DappRequestQueueContext'
import { SendTransactionRequest } from 'src/app/features/dappRequests/types/DappRequestTypes'
import { GasFeeResult } from 'uniswap/src/features/gas/types'
import { useBooleanState } from 'utilities/src/react/useBooleanState'
import { DappTransactionScanningContent } from 'wallet/src/components/dappRequests/DappTransactionScanningContent'
import { TransactionRiskLevel } from 'wallet/src/features/dappRequests/types'
import { shouldDisableConfirm } from 'wallet/src/features/dappRequests/utils/riskUtils'

interface ParsedTransactionRequestContentProps {
  transactionGasFeeResult: GasFeeResult
  dappRequest: SendTransactionRequest
  onCancel: () => Promise<void>
  onConfirm: () => Promise<void>
}

/**
 * Transaction request content with Blockaid security scanning
 * Parses transaction data and displays it with asset transfers, security warnings, and detailed information
 */
export function ParsedTransactionRequestContent({
  dappRequest,
  transactionGasFeeResult,
  onCancel,
  onConfirm,
}: ParsedTransactionRequestContentProps): JSX.Element | null {
  const { t } = useTranslation()
  const { dappUrl, currentAccount } = useDappRequestQueueContext()
  const activeChain = useDappLastChainId(dappUrl)
  const { value: confirmedRisk, setValue: setConfirmedRisk } = useBooleanState(false)
  // Initialize with null to indicate scan hasn't completed yet
  const [riskLevel, setRiskLevel] = useState<TransactionRiskLevel | null>(null)

  const { chainId: transactionChainId } = dappRequest.transaction
  const chainId = transactionChainId ?? activeChain

  // If no valid chainId, throw so that we fall back to the legacy UI
  if (!chainId) {
    throw new Error('No valid chainId available for transaction scanning')
  }

  const disableConfirm = shouldDisableConfirm({
    riskLevel,
    confirmedRisk,
    hasGasFee: !!transactionGasFeeResult.value,
  })

  return (
    <DappRequestContent
      confirmText={t('common.button.confirm')}
      title={t('dapp.request.base.title')}
      transactionGasFeeResult={transactionGasFeeResult}
      disableConfirm={disableConfirm}
      onCancel={onCancel}
      onConfirm={onConfirm}
      showAddressFooter={false}
    >
      <DappTransactionScanningContent
        chainId={chainId}
        account={currentAccount.address}
        transaction={dappRequest.transaction}
        dappUrl={dappUrl}
        gasFee={transactionGasFeeResult}
        requestMethod={dappRequest.type}
        confirmedRisk={confirmedRisk}
        onConfirmRisk={setConfirmedRisk}
        onRiskLevelChange={setRiskLevel}
      />
    </DappRequestContent>
  )
}
