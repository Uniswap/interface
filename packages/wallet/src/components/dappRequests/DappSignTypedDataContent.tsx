import type { BlockaidScanJsonRpcRequest } from '@universe/api'
import { useEffect, useMemo } from 'react'
import { Flex } from 'ui/src'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import type { GasFeeResult } from 'uniswap/src/features/gas/types'
import { DappRequestFooter } from 'wallet/src/components/dappRequests/DappRequestFooter'
import { useTypedDataWarningConfirmation } from 'wallet/src/components/dappRequests/hooks/useTypedDataWarningConfirmation'
import { NonStandardTypedDataContent } from 'wallet/src/components/dappRequests/SignTypedData/NonStandardTypedDataContent'
import { Permit2Content } from 'wallet/src/components/dappRequests/SignTypedData/Permit2Content'
import { StandardTypedDataContent } from 'wallet/src/components/dappRequests/SignTypedData/StandardTypedDataContent'
import { TransactionLoadingState } from 'wallet/src/components/dappRequests/TransactionLoadingState'
import { TransactionPreviewCard } from 'wallet/src/components/dappRequests/TransactionPreviewCard'
import { isEIP712TypedData } from 'wallet/src/components/dappRequests/types/EIP712Types'
import { isPermit2 } from 'wallet/src/components/dappRequests/types/Permit2Types'
import { useTypedDataSections } from 'wallet/src/features/dappRequests/hooks/useTypedDataSections'
import type { TransactionRiskLevel } from 'wallet/src/features/dappRequests/types'

interface DappSignTypedDataContentProps {
  typedData: string
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
 * Component that handles Blockaid scanning and display for eth_signTypedData methods
 * Supports permit2, nonstandard, standard typed data formats, and UniswapX swaps
 */
export function DappSignTypedDataContent({
  typedData,
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
}: DappSignTypedDataContentProps): JSX.Element {
  // Parse typed data
  const parsedTypedData = useMemo((): unknown => {
    try {
      return JSON.parse(typedData) as unknown
    } catch {
      return null
    }
  }, [typedData])

  // Get transaction sections - handles both UniswapX and regular typed data via Blockaid
  const { sections, riskLevel, isLoading } = useTypedDataSections({
    parsedTypedData,
    chainId,
    account,
    method,
    params,
    dappUrl,
  })

  const hasAssetChanges = sections.length > 0
  const isNonStandard = !isEIP712TypedData(parsedTypedData)

  // Manage warning confirmations for non-standard and risk-based warnings
  const { confirmedNonStandard, confirmedRiskWarning, handleNonStandardConfirm, handleRiskConfirm } =
    useTypedDataWarningConfirmation({
      isNonStandard,
      riskLevel,
      confirmedRisk,
      onConfirmRisk,
    })

  // Notify parent when risk level changes
  useEffect(() => {
    onRiskLevelChange(riskLevel)
  }, [riskLevel, onRiskLevelChange])

  if (isLoading) {
    return <TransactionLoadingState />
  }

  // Render appropriate content based on typed data type
  const renderTypedDataContent = (): JSX.Element => {
    if (isNonStandard) {
      return (
        <NonStandardTypedDataContent
          typedData={typedData}
          checked={confirmedNonStandard}
          onCheckedChange={handleNonStandardConfirm}
        />
      )
    }

    if (isPermit2(parsedTypedData)) {
      return <Permit2Content typedData={typedData} />
    }

    return <StandardTypedDataContent domain={parsedTypedData.domain || {}} message={parsedTypedData.message} />
  }

  return (
    <Flex gap="$spacing12">
      <TransactionPreviewCard sections={sections} riskLevel={riskLevel} chainId={chainId}>
        {!hasAssetChanges && renderTypedDataContent()}
      </TransactionPreviewCard>

      <DappRequestFooter
        chainId={chainId}
        account={account}
        riskLevel={riskLevel}
        gasFee={gasFee}
        requestMethod={requestMethod}
        showSmartWalletActivation={showSmartWalletActivation}
        confirmedRisk={confirmedRiskWarning}
        onConfirmRisk={handleRiskConfirm}
      />
    </Flex>
  )
}
