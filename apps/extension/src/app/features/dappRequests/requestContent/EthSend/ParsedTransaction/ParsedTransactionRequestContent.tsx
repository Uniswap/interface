import type { GasFeeResult } from '@universe/api'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DappRequestContent } from 'src/app/features/dappRequests/DappRequestContent'
import { useDappRequestQueueContext } from 'src/app/features/dappRequests/DappRequestQueueContext'
import { SendTransactionRequest } from 'src/app/features/dappRequests/types/DappRequestTypes'
import type { GasFeeOverrides } from 'uniswap/src/features/gas/types'
import { useBooleanState } from 'utilities/src/react/useBooleanState'
import { DappTransactionScanningContent } from 'wallet/src/components/dappRequests/DappTransactionScanningContent'
import { useSiteVerification } from 'wallet/src/features/dappRequests/hooks/useSiteVerification'
import { TransactionRiskLevel } from 'wallet/src/features/dappRequests/types'
import { shouldDisableConfirm } from 'wallet/src/features/dappRequests/utils/riskUtils'

interface ParsedTransactionRequestContentProps {
  transactionGasFeeResult: GasFeeResult
  dappRequest: SendTransactionRequest
  onCancel: () => Promise<void>
  onConfirm: () => Promise<void>
  gasOverrides?: GasFeeOverrides
  onChangeGasOverrides?: (overrides: GasFeeOverrides | undefined) => void
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
  gasOverrides,
  onChangeGasOverrides,
}: ParsedTransactionRequestContentProps): JSX.Element | null {
  const { t } = useTranslation()
  const { dappUrl, currentAccount } = useDappRequestQueueContext()
  const { value: confirmedRisk, setValue: setConfirmedRisk } = useBooleanState(false)
  // Initialize with null to indicate scan hasn't completed yet
  const [riskLevel, setRiskLevel] = useState<TransactionRiskLevel | null>(null)

  const { verificationStatus } = useSiteVerification(dappUrl)

  // Pinned at intake to the chain that will be signed. Scanning the live chain instead could
  // show the user a different one.
  const { chainId: requestChainId } = dappRequest.transaction

  // If no valid chainId, throw so that we fall back to the legacy UI
  if (!requestChainId) {
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
      isCriticalRisk={riskLevel === TransactionRiskLevel.Critical}
      onCancel={onCancel}
      onConfirm={onConfirm}
      showAddressFooter={false}
    >
      <DappTransactionScanningContent
        chainId={requestChainId}
        account={currentAccount.address}
        transaction={dappRequest.transaction}
        dappUrl={dappUrl}
        siteVerificationStatus={verificationStatus}
        gasFee={transactionGasFeeResult}
        requestMethod={dappRequest.type}
        confirmedRisk={confirmedRisk}
        gasOverrides={gasOverrides}
        onConfirmRisk={setConfirmedRisk}
        onChangeGasOverrides={onChangeGasOverrides}
        onRiskLevelChange={setRiskLevel}
      />
    </DappRequestContent>
  )
}
