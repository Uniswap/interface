import type { BlockaidScanTransactionResponse } from '@universe/api'
import { useMemo } from 'react'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { isUniswapContract } from 'uniswap/src/features/dappRequests/uniswapContracts'
import { AddressStringFormat, normalizeAddress } from 'uniswap/src/utils/addresses'
import type { ApprovalContractInfo } from 'wallet/src/components/dappRequests/ApprovalContractRow'
import {
  DappVerificationStatus,
  TransactionRiskLevel,
  TransactionSection,
  TransactionSectionType,
} from 'wallet/src/features/dappRequests/types'
import { extractContractName } from 'wallet/src/features/dappRequests/utils/blockaidUtils'

interface UseApprovalContractInfoParams {
  sections: TransactionSection[]
  scanResult: BlockaidScanTransactionResponse | null | undefined
  riskLevel: TransactionRiskLevel
  chainId: UniverseChainId
  /** Blockaid site verification (merged with WC Verify on mobile), undefined while loading */
  siteVerificationStatus?: DappVerificationStatus
}

interface UseApprovalContractInfoResult {
  /** Spender contract pinned as an always-visible "Contract" row, when derivable */
  approvalContract?: ApprovalContractInfo
  /** Inline unverified-site alert for approvals */
  showUnverifiedSiteWarning: boolean
}

/**
 * Derives the pinned spender "Contract" row and unverified-site alert state for
 * approval requests. Shared by the single-transaction and wallet_sendCalls flows.
 */
export function useApprovalContractInfo({
  sections,
  scanResult,
  riskLevel,
  chainId,
  siteVerificationStatus,
}: UseApprovalContractInfoParams): UseApprovalContractInfoResult {
  const approvingAssets = useMemo(
    () => sections.find((section) => section.type === TransactionSectionType.Approving)?.assets,
    [sections],
  )

  // Suppressed for critical-risk transactions, which keep the existing malicious presentation
  const approvalContract = useMemo<ApprovalContractInfo | undefined>(() => {
    if (!approvingAssets?.length || riskLevel === TransactionRiskLevel.Critical) {
      return undefined
    }

    const spenderAddresses = new Set(
      approvingAssets
        .map((asset) =>
          asset.spenderAddress ? normalizeAddress(asset.spenderAddress, AddressStringFormat.Lowercase) : undefined,
        )
        .filter((address): address is string => Boolean(address)),
    )
    const [spenderAddress] = spenderAddresses
    // Multi-spender approvals keep the existing per-spender popover instead
    if (spenderAddresses.size !== 1 || !spenderAddress) {
      return undefined
    }

    const contractName = extractContractName(scanResult, spenderAddress)
    const showAddress = siteVerificationStatus === DappVerificationStatus.Unverified
    if (!contractName && !showAddress) {
      return undefined
    }

    return {
      spenderContractAddress: spenderAddress,
      contractName,
      showAddress,
      // The contract badge vouches for the contract only — it shows regardless of
      // which site requested the approval
      isVerifiedUniswapContract: isUniswapContract({ chainId, address: spenderAddress }),
    }
  }, [approvingAssets, riskLevel, scanResult, siteVerificationStatus, chainId])

  // Skipped when a transaction-level warning banner is already showing
  const showUnverifiedSiteWarning =
    siteVerificationStatus === DappVerificationStatus.Unverified &&
    Boolean(approvingAssets?.length) &&
    riskLevel === TransactionRiskLevel.None

  return { approvalContract, showUnverifiedSiteWarning }
}
