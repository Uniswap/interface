import type { BlockaidScanTransactionRequest } from '@universe/api'
import { useEffect, useMemo } from 'react'
import { Flex } from 'ui/src'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import type { GasFeeResult } from 'uniswap/src/features/gas/types'
import type { EthTransaction } from 'uniswap/src/types/walletConnect'
import { DappRequestFooter } from 'wallet/src/components/dappRequests/DappRequestFooter'
import { TransactionErrorType } from 'wallet/src/components/dappRequests/TransactionErrorSection'
import { TransactionLoadingState } from 'wallet/src/components/dappRequests/TransactionLoadingState'
import { TransactionPreviewCard } from 'wallet/src/components/dappRequests/TransactionPreviewCard'
import { useBlockaidTransactionScan } from 'wallet/src/features/dappRequests/hooks/useBlockaidTransactionScan'
import { TransactionRiskLevel } from 'wallet/src/features/dappRequests/types'
import {
  determineTransactionErrorType,
  extractContractName,
  extractFunctionName,
  parseTransactionSections,
} from 'wallet/src/features/dappRequests/utils/blockaidUtils'
import { buildBlockaidScanTransactionRequest } from 'wallet/src/features/dappRequests/utils/buildBlockaidScanTransactionRequest'

interface DappTransactionScanningContentProps {
  transaction: EthTransaction
  chainId: UniverseChainId
  account: string
  dappUrl: string
  confirmedRisk: boolean
  onConfirmRisk: (confirmed: boolean) => void
  onRiskLevelChange: (riskLevel: TransactionRiskLevel) => void
  errorType?: TransactionErrorType
  gasFee?: GasFeeResult
  requestMethod?: string
  showSmartWalletActivation?: boolean
}

/**
 * Shared component that handles Blockaid transaction scanning and displays results
 * Used by both Extension and Mobile for consistent transaction security scanning
 */
export function DappTransactionScanningContent({
  transaction,
  chainId,
  account,
  dappUrl,
  confirmedRisk,
  onConfirmRisk,
  onRiskLevelChange,
  errorType: providedErrorType,
  gasFee,
  requestMethod,
  showSmartWalletActivation,
}: DappTransactionScanningContentProps): JSX.Element {
  const { to: toAddress, data } = transaction

  // Build Blockaid scan request
  const blockaidRequest = useMemo<BlockaidScanTransactionRequest | null>(() => {
    return buildBlockaidScanTransactionRequest({
      chainId,
      account,
      transaction,
      dappUrl,
    })
  }, [chainId, account, transaction, dappUrl])

  // Scan transaction with Blockaid
  const { scanResult, isLoading: isScanLoading } = useBlockaidTransactionScan(blockaidRequest, Boolean(blockaidRequest))

  // Extract function name and contract name from simulation result
  const functionName = useMemo(() => extractFunctionName(scanResult), [scanResult])
  const contractName = useMemo(() => extractContractName(scanResult, toAddress), [scanResult, toAddress])

  // Parse the Blockaid scan result into displayable sections
  const { sections, riskLevel } = useMemo(
    () => parseTransactionSections(scanResult ?? null, chainId),
    [scanResult, chainId],
  )

  // Determine the appropriate error type (if any) to display
  const errorType = determineTransactionErrorType({ sections, providedErrorType, rawData: data ?? '' })

  // Notify parent when risk level changes
  useEffect(() => {
    onRiskLevelChange(riskLevel)
  }, [riskLevel, onRiskLevelChange])

  if (isScanLoading) {
    return <TransactionLoadingState />
  }

  return (
    <Flex gap="$spacing12">
      {/* Transaction Preview Card */}
      <TransactionPreviewCard
        sections={sections}
        riskLevel={riskLevel}
        errorType={errorType}
        functionName={functionName}
        contractAddress={toAddress}
        contractName={contractName}
        rawData={data ?? ''}
        chainId={chainId}
      />

      <DappRequestFooter
        chainId={chainId}
        account={account}
        riskLevel={riskLevel}
        confirmedRisk={confirmedRisk}
        gasFee={gasFee}
        requestMethod={requestMethod}
        showSmartWalletActivation={showSmartWalletActivation}
        onConfirmRisk={onConfirmRisk}
      />
    </Flex>
  )
}
