import type { BlockaidScanJsonRpcRequest } from '@universe/api'
import { useMemo } from 'react'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { isUniswapXSwapRequest, UniswapXSwapRequest } from 'wallet/src/components/dappRequests/types/Permit2Types'
import { useBlockaidJsonRpcScan } from 'wallet/src/features/dappRequests/hooks/useBlockaidJsonRpcScan'
import { useParseUniswapXSwap } from 'wallet/src/features/dappRequests/hooks/useParseUniswapXSwap'
import type { ParsedTransactionData } from 'wallet/src/features/dappRequests/types'
import { parseTransactionSections } from 'wallet/src/features/dappRequests/utils/blockaidUtils'
import { buildBlockaidScanJsonRpcRequest } from 'wallet/src/features/dappRequests/utils/buildBlockaidScanJsonRpcRequest'

interface UseTypedDataSectionsParams {
  parsedTypedData: unknown
  chainId: UniverseChainId
  account: string
  method: BlockaidScanJsonRpcRequest['data']['method']
  params: unknown[]
  dappUrl: string
}

interface UseTypedDataSectionsResult extends ParsedTransactionData {
  isLoading: boolean
}

/**
 * Hook that returns transaction sections for typed data requests.
 * Handles both UniswapX swaps (with custom parsing) and regular typed data (via Blockaid scanning).
 * Risk level always comes from Blockaid.
 */
export function useTypedDataSections({
  parsedTypedData,
  chainId,
  account,
  method,
  params,
  dappUrl,
}: UseTypedDataSectionsParams): UseTypedDataSectionsResult {
  // Detect UniswapX swap requests
  const isUniswapX = isUniswapXSwapRequest(parsedTypedData)
  const uniswapXTypedData = isUniswapX ? (parsedTypedData as UniswapXSwapRequest) : null

  // Build Blockaid scan request (always needed for risk level)
  const blockaidRequest = useMemo(
    () =>
      buildBlockaidScanJsonRpcRequest({
        chainId,
        account,
        method,
        params,
        dappUrl,
      }),
    [chainId, account, method, params, dappUrl],
  )

  // Scan with Blockaid (for risk level and fallback sections)
  const { scanResult, isLoading: isBlockaidLoading } = useBlockaidJsonRpcScan(blockaidRequest, Boolean(blockaidRequest))

  // Parse UniswapX sections (returns empty when not UniswapX)
  const { sections: uniswapXSections, isLoading: isUniswapXLoading } = useParseUniswapXSwap(uniswapXTypedData, chainId)

  // Parse Blockaid result for risk level and sections
  const { sections: blockaidSections, riskLevel } = useMemo(
    () => parseTransactionSections(scanResult ?? null, chainId),
    [scanResult, chainId],
  )

  // Use UniswapX sections if available, otherwise fall back to Blockaid sections
  const sections = isUniswapX ? uniswapXSections : blockaidSections

  // Loading: wait for Blockaid (always), plus UniswapX parsing if applicable
  const isLoading = isBlockaidLoading || (isUniswapX && isUniswapXLoading)

  return {
    sections,
    riskLevel,
    isLoading,
  }
}
