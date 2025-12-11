import type { BlockaidScanJsonRpcRequest } from '@universe/api'
import { useEffect, useMemo } from 'react'
import { Flex } from 'ui/src'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import type { GasFeeResult } from 'uniswap/src/features/gas/types'
import { DappRequestFooter } from 'wallet/src/components/dappRequests/DappRequestFooter'
import { TransactionErrorType } from 'wallet/src/components/dappRequests/TransactionErrorSection'
import { TransactionLoadingState } from 'wallet/src/components/dappRequests/TransactionLoadingState'
import { TransactionPreviewCard } from 'wallet/src/components/dappRequests/TransactionPreviewCard'
import { useBlockaidJsonRpcScan } from 'wallet/src/features/dappRequests/hooks/useBlockaidJsonRpcScan'
import type { Call } from 'wallet/src/features/dappRequests/types'
import { TransactionRiskLevel } from 'wallet/src/features/dappRequests/types'
import {
  determineTransactionErrorType,
  extractContractName,
  extractFunctionName,
  parseTransactionSections,
} from 'wallet/src/features/dappRequests/utils/blockaidUtils'
import { buildBlockaidScanJsonRpcRequest } from 'wallet/src/features/dappRequests/utils/buildBlockaidScanJsonRpcRequest'

interface DappSendCallsScanningContentProps {
  calls: Call[]
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
 * Shared component that handles Blockaid scanning for wallet_sendCalls requests
 * Scans the entire batch of calls and displays simulation results with risk analysis
 */
export function DappSendCallsScanningContent({
  calls,
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
}: DappSendCallsScanningContentProps): JSX.Element {
  // Extract representative data from the first call for display purposes
  const firstCall = calls.length > 0 ? calls[0] : undefined
  const toAddress = firstCall?.to
  const rawData = firstCall?.data

  // Build Blockaid scan request for wallet_sendCalls
  const blockaidRequest = useMemo<BlockaidScanJsonRpcRequest | null>(() => {
    return buildBlockaidScanJsonRpcRequest({
      chainId,
      account,
      method: 'wallet_sendCalls',
      params: [
        {
          version: '1.0',
          chainId: `0x${chainId.toString(16)}`,
          from: account,
          calls,
        },
      ],
      dappUrl,
    })
  }, [chainId, account, calls, dappUrl])

  // Scan calls with Blockaid
  const { scanResult, isLoading: isScanLoading } = useBlockaidJsonRpcScan(blockaidRequest, blockaidRequest !== null)

  // Extract function name and contract name from simulation result
  const functionName = useMemo(() => extractFunctionName(scanResult), [scanResult])
  const contractName = useMemo(() => extractContractName(scanResult, toAddress), [scanResult, toAddress])

  // Parse the Blockaid scan result into displayable sections
  const { sections, riskLevel } = useMemo(
    () => parseTransactionSections(scanResult ?? null, chainId),
    [scanResult, chainId],
  )

  // Determine the appropriate error type (if any) to display
  const errorType = determineTransactionErrorType({ sections, providedErrorType, rawData: rawData ?? '' })

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
        rawData={rawData ?? ''}
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
