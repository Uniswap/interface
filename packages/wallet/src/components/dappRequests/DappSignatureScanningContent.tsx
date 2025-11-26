import type { BlockaidScanJsonRpcRequest } from '@universe/api'
import { useEffect, useMemo } from 'react'
import { Flex } from 'ui/src'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import type { GasFeeResult } from 'uniswap/src/features/gas/types'
import { DappRequestFooter } from 'wallet/src/components/dappRequests/DappRequestFooter'
import { SignatureMessageSection } from 'wallet/src/components/dappRequests/SignatureMessageSection'
import { TransactionLoadingState } from 'wallet/src/components/dappRequests/TransactionLoadingState'
import { TransactionPreviewCard } from 'wallet/src/components/dappRequests/TransactionPreviewCard'
import { useBlockaidJsonRpcScan } from 'wallet/src/features/dappRequests/hooks/useBlockaidJsonRpcScan'
import { TransactionRiskLevel } from 'wallet/src/features/dappRequests/types'
import { parseTransactionSections } from 'wallet/src/features/dappRequests/utils/blockaidUtils'
import { buildBlockaidScanJsonRpcRequest } from 'wallet/src/features/dappRequests/utils/buildBlockaidScanJsonRpcRequest'

interface DappSignatureScanningContentProps {
  message: string
  isDecoded: boolean
  chainId: UniverseChainId
  account: string
  method: BlockaidScanJsonRpcRequest['data']['method']
  params: unknown[]
  dappUrl: string
  gasFee?: GasFeeResult
  requestMethod?: string
  showSmartWalletActivation?: boolean
  confirmedRisk: boolean
  onConfirmRisk: (confirmed: boolean) => void
  onRiskLevelChange: (riskLevel: TransactionRiskLevel) => void
}

/**
 * Shared component that handles Blockaid signature scanning and displays results
 * Supports personal_sign, eth_sign, eth_signTypedData, and wallet_sendCalls methods
 */
export function DappSignatureScanningContent({
  message,
  isDecoded,
  chainId,
  account,
  method,
  params,
  dappUrl,
  gasFee,
  requestMethod,
  showSmartWalletActivation,
  confirmedRisk,
  onConfirmRisk,
  onRiskLevelChange,
}: DappSignatureScanningContentProps): JSX.Element {
  // Build Blockaid scan request
  const blockaidRequest = useMemo(() => {
    return buildBlockaidScanJsonRpcRequest({
      chainId,
      account,
      method,
      params,
      dappUrl,
    })
  }, [chainId, account, method, params, dappUrl])

  // Scan signature with Blockaid
  const { scanResult, isLoading } = useBlockaidJsonRpcScan(blockaidRequest, Boolean(blockaidRequest))

  // Parse the Blockaid scan result to extract risk information
  const { riskLevel } = useMemo(() => parseTransactionSections(scanResult ?? null), [scanResult])

  // Show error type when message cannot be decoded
  const errorType = !isDecoded ? 'decode_message' : undefined

  // Notify parent when risk level changes
  useEffect(() => {
    onRiskLevelChange(riskLevel)
  }, [riskLevel, onRiskLevelChange])

  if (isLoading) {
    return <TransactionLoadingState />
  }

  return (
    <Flex gap="$spacing12">
      {/* Signature Preview Card */}
      <TransactionPreviewCard sections={[]} riskLevel={riskLevel} errorType={errorType} chainId={chainId}>
        <SignatureMessageSection message={message} />
      </TransactionPreviewCard>

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
