import { type BlockaidScanTransactionResponse } from '@universe/api'
import { getNativeAddress } from 'uniswap/src/constants/addresses'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { AddressStringFormat, normalizeAddress } from 'uniswap/src/utils/addresses'
import { formatUnits } from 'viem'
import { TransactionErrorType } from 'wallet/src/components/dappRequests/TransactionErrorSection'
import {
  type ParsedTransactionData,
  type TransactionAsset,
  TransactionRiskLevel,
  type TransactionSection,
  TransactionSectionType,
} from 'wallet/src/features/dappRequests/types'

/**
 * Special marker for unlimited approvals to be localized in the UI
 */
export const UNLIMITED_APPROVAL_AMOUNT = 'UNLIMITED'

/**
 * Maximum number of decimal places to display for amounts
 */
const MAX_DECIMAL_PLACES = 6

/**
 * Rounds a numeric value to a maximum of 6 decimal places
 * @param value - The value to round (number or string)
 * @returns Rounded value as string
 */
export function roundToDecimals(value: number | string): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value

  if (isNaN(numValue)) {
    return String(value)
  }

  // Round to 6 decimal places and remove trailing zeros
  const rounded = parseFloat(numValue.toFixed(MAX_DECIMAL_PLACES))
  return String(rounded)
}

/**
 * Threshold for treating large approval amounts as unlimited
 * Any approval amount >= this value is considered effectively unlimited
 * 1e24 is roughly 1 septillion tokens, far exceeding any realistic supply
 */
const LARGE_APPROVAL_THRESHOLD = 1e24

/**
 * Checks if an approval amount represents an unlimited/max approval
 * Detects several patterns of unlimited approvals:
 * - 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff (max uint256)
 * - 0xffffffffffffffffffffffffffffffffffffffff (max uint128/160 - shorter but all f's)
 * - Values very close to max (e.g., 0xfff...ffe17b7 with >90% f's)
 * - Extremely large numeric values (>= 1e24) when converted to decimal
 *
 * @param approval - The hex approval amount (e.g., "0xffffffffffffffff...")
 * @param decimals - The token decimals, used for numeric value checking
 * @returns true if the approval should be treated as unlimited
 */
function isUnlimitedApproval(approval: string | undefined, decimals: number = 18): boolean {
  if (!approval) {
    return false
  }

  const lowerApproval = approval.toLowerCase()

  // Remove '0x' prefix for analysis
  const hexDigits = lowerApproval.startsWith('0x') ? lowerApproval.slice(2) : lowerApproval

  // Check if it's all f's (any length) - covers max uint256, uint128, uint160, etc.
  if (/^f+$/.test(hexDigits)) {
    return true
  }

  // Check if it's a very large number with mostly f's
  // This catches cases like 0xfff...ffe17b7 which are effectively unlimited
  if (hexDigits.length >= 40) {
    // At least 160 bits
    const fCount = hexDigits.match(/^f+/)?.[0]?.length || 0
    // If more than 90% of the leading digits are 'f', consider it unlimited
    if (fCount / hexDigits.length > 0.9) {
      return true
    }
  }

  // Check if the numeric value is extremely large (effectively unlimited)
  // This catches cases that don't match the hex patterns above but are still impractically large
  const formattedAmount = formatApprovalAmount(approval, decimals)
  if (formattedAmount) {
    const numericValue = parseFloat(formattedAmount)
    if (!isNaN(numericValue) && numericValue >= LARGE_APPROVAL_THRESHOLD) {
      return true
    }
  }

  return false
}

/**
 * Gets the appropriate address for an asset
 * For native assets, returns the native address for the chain
 * For other assets (ERC20, NFT, etc.), returns the contract address
 */
function getAssetAddress(asset: { type: string; chain_id?: number; address?: string }): string {
  if (asset.type === 'NATIVE' && asset.chain_id !== undefined) {
    return getNativeAddress(asset.chain_id)
  }
  return asset.address || ''
}

/**
 * Converts a hex approval amount to a human-readable decimal string
 * Handles very large numbers that would overflow JavaScript's number precision
 */
function formatApprovalAmount(approval: string | undefined, decimals: number): string | undefined {
  if (!approval) {
    return undefined
  }

  try {
    // Convert hex to BigInt and format with viem
    const hexValue = approval.startsWith('0x') ? approval : `0x${approval}`
    const bigIntValue = BigInt(hexValue)
    const formatted = formatUnits(bigIntValue, decimals)

    // For very large numbers, just return the whole part
    const [wholePart = '0', fractionalPart] = formatted.split('.')
    if (wholePart.length > 15) {
      // Number too large to be meaningful, likely unlimited
      return wholePart
    }

    // Truncate to MAX_DECIMAL_PLACES
    if (!fractionalPart) {
      return wholePart
    }

    const trimmedFractional = fractionalPart.slice(0, MAX_DECIMAL_PLACES).replace(/0+$/, '')
    return trimmedFractional ? `${wholePart}.${trimmedFractional}` : wholePart
  } catch {
    return undefined
  }
}

interface DetermineTransactionErrorTypeParams {
  sections: TransactionSection[]
  providedErrorType: TransactionErrorType | undefined
  rawData: string | undefined
}

/**
 * Determines the appropriate error type to display for a transaction request.
 *
 * When a transaction request cannot be fully parsed or understood, we need to show
 * an appropriate error/warning state to the user. This function implements the fallback
 * logic that shows "Contract interaction" when specific conditions are met.
 *
 * The "Contract interaction" fallback is shown when:
 * 1. No asset transfer sections were detected from the Blockaid scan (sections.length === 0)
 *    - This means we couldn't parse any token transfers, approvals, or other known patterns
 * 2. No explicit error type was provided by the caller (providedErrorType is undefined)
 *    - The caller hasn't already identified a specific error condition
 * 3. The transaction contains calldata (rawData is truthy)
 *    - This indicates a contract call, not a simple ETH transfer
 *
 * @param params - Object containing sections, providedErrorType, and rawData
 * @param params.sections - Parsed transaction sections from Blockaid scan (transfers, approvals, etc.)
 * @param params.providedErrorType - Explicitly provided error type from the caller (if any)
 * @param params.rawData - The transaction's calldata (hex string). If present, indicates a contract call.
 *
 * @returns The error type to display, or undefined if no error state should be shown
 */
export function determineTransactionErrorType({
  sections,
  providedErrorType,
  rawData,
}: DetermineTransactionErrorTypeParams): TransactionErrorType | undefined {
  const showContractInteractionFallback = sections.length === 0 && !providedErrorType && rawData
  return showContractInteractionFallback ? 'contract_interaction' : providedErrorType
}

/**
 * Determines the risk level from Blockaid validation classification
 */
export function getRiskLevelFromClassification(classification?: string): TransactionRiskLevel {
  if (!classification) {
    return TransactionRiskLevel.None
  }

  const lowerClassification = classification.toLowerCase()

  // Malicious and critical classifications
  if (lowerClassification.includes('malicious') || lowerClassification.includes('attack')) {
    return TransactionRiskLevel.Critical
  }

  // Warning classifications
  if (lowerClassification.includes('warning') || lowerClassification.includes('suspicious')) {
    return TransactionRiskLevel.Warning
  }

  return TransactionRiskLevel.None
}

/**
 * Type alias for asset diffs array from successful simulation
 */
type AssetDiffs = NonNullable<
  Extract<BlockaidScanTransactionResponse['simulation'], { status: 'Success' }>['account_summary']
>['assets_diffs']

/**
 * Type alias for exposures array from successful simulation
 */
type Exposures = NonNullable<
  Extract<BlockaidScanTransactionResponse['simulation'], { status: 'Success' }>['account_summary']
>['exposures']

/**
 * Parses sending assets from Blockaid asset diffs
 */
export function parseSendingAssets(assetsDiffs: AssetDiffs, chainId: UniverseChainId): TransactionSection | null {
  const sendingAssets: TransactionAsset[] = []

  assetsDiffs.forEach((assetDiff: (typeof assetsDiffs)[number]) => {
    if (assetDiff.out.length > 0) {
      const outAmount = assetDiff.out[0]
      if (!outAmount) {
        return
      }
      const asset = assetDiff.asset

      sendingAssets.push({
        type: asset.type,
        symbol: asset.symbol,
        name: asset.type === 'ERC20' ? asset.name || asset.symbol : asset.name,
        amount: outAmount.value !== undefined ? roundToDecimals(outAmount.value) : undefined,
        usdValue: outAmount.usd_price ? String(outAmount.usd_price) : undefined,
        logoUrl: asset.logo_url,
        address: getAssetAddress(asset),
        chainId,
      })
    }
  })

  if (sendingAssets.length === 0) {
    return null
  }

  return {
    type: TransactionSectionType.Sending,
    assets: sendingAssets,
  }
}

/**
 * Parses receiving assets from Blockaid asset diffs
 */
export function parseReceivingAssets(assetsDiffs: AssetDiffs, chainId: UniverseChainId): TransactionSection | null {
  const receivingAssets: TransactionAsset[] = []

  assetsDiffs.forEach((assetDiff: (typeof assetsDiffs)[number]) => {
    if (assetDiff.in.length > 0) {
      const inAmount = assetDiff.in[0]
      if (!inAmount) {
        return
      }
      const asset = assetDiff.asset

      receivingAssets.push({
        type: asset.type,
        symbol: asset.symbol,
        name: asset.type === 'ERC20' ? asset.name || asset.symbol : asset.name,
        amount: inAmount.value !== undefined ? roundToDecimals(inAmount.value) : undefined,
        usdValue: inAmount.usd_price ? String(inAmount.usd_price) : undefined,
        logoUrl: asset.logo_url,
        address: getAssetAddress(asset),
        chainId,
      })
    }
  })

  if (receivingAssets.length === 0) {
    return null
  }

  return {
    type: TransactionSectionType.Receiving,
    assets: receivingAssets,
  }
}

/**
 * Parses approval exposures from Blockaid exposures
 */
export function parseApprovals(exposures: Exposures, chainId: UniverseChainId): TransactionSection | null {
  const exposureAssets: TransactionAsset[] = []

  exposures.forEach((exposure: (typeof exposures)[number]) => {
    const asset = exposure.asset
    // Spenders is a record keyed by address
    Object.entries(exposure.spenders).forEach(([spenderAddress, spenderData]) => {
      // Get the asset decimals for unlimited approval detection
      const decimals = asset.type === 'ERC20' && 'decimals' in asset ? asset.decimals : 18
      const unlimited = isUnlimitedApproval(spenderData.approval, decimals)

      // Determine the amount to display
      let amount: string | undefined
      if (unlimited) {
        amount = UNLIMITED_APPROVAL_AMOUNT
      } else if (spenderData.approval) {
        // Format the approval amount from hex, using asset decimals if available
        const formattedAmount = formatApprovalAmount(spenderData.approval, decimals)
        if (formattedAmount) {
          // Round it to avoid excessive decimals
          amount = roundToDecimals(formattedAmount)
        }
      }

      // Only add if we have an amount to display
      if (amount) {
        exposureAssets.push({
          type: asset.type,
          symbol: asset.symbol,
          name: asset.type === 'ERC20' ? asset.name || asset.symbol : asset.name,
          amount,
          // USD value is not shown for approvals - only the approval amount
          usdValue: undefined,
          logoUrl: asset.logo_url,
          address: getAssetAddress(asset),
          chainId,
          spenderAddress,
        })
      }
    })
  })

  if (exposureAssets.length === 0) {
    return null
  }

  return {
    type: TransactionSectionType.Approving,
    assets: exposureAssets,
  }
}

/**
 * Parses Blockaid scan result into transaction sections for UI display
 */
export function parseTransactionSections(
  scanResult: BlockaidScanTransactionResponse | null,
  chainId: UniverseChainId,
): ParsedTransactionData {
  // Always check validation classification first (critical for signature requests that lack simulation)
  const classification = scanResult?.validation?.classification
  const riskLevel = getRiskLevelFromClassification(classification)

  if (!scanResult?.simulation || scanResult.simulation.status !== 'Success') {
    return {
      sections: [],
      riskLevel, // Use validation-based risk level
    }
  }

  const { assets_diffs, exposures } = scanResult.simulation.account_summary

  return {
    sections: [
      parseSendingAssets(assets_diffs, chainId),
      parseReceivingAssets(assets_diffs, chainId),
      parseApprovals(exposures, chainId),
    ].filter((section): section is TransactionSection => section !== null),
    riskLevel,
  }
}

/**
 * Extracts the function name from a Blockaid scan result's function signature
 * @param scanResult - The Blockaid scan transaction response
 * @returns The function name (e.g., "approve" from "approve(address,address,uint160,uint48)"), or undefined if not available
 */
export function extractFunctionName(scanResult?: BlockaidScanTransactionResponse | null): string | undefined {
  if (scanResult?.simulation?.status !== 'Success') {
    return undefined
  }

  // Parse function signature to extract function name
  // Example: "approve(address,address,uint160,uint48)" -> "approve"
  const params = scanResult.simulation.params
  const functionSignature = params?.calldata?.function_signature

  if (typeof functionSignature === 'string') {
    const match = functionSignature.match(/^([^(]+)/)
    return match?.[1]
  }

  return undefined
}

/**
 * Extracts the contract name for a given address from Blockaid scan result
 * Uses case-insensitive address matching since Ethereum addresses can be checksummed
 * @param scanResult - The Blockaid scan transaction response
 * @param address - The contract address to look up
 * @returns The contract name if found, or undefined
 */
export function extractContractName(
  scanResult: BlockaidScanTransactionResponse | null | undefined,
  address: string | undefined,
): string | undefined {
  if (!address || scanResult?.simulation?.status !== 'Success') {
    return undefined
  }

  const addressDetails = scanResult.simulation.address_details

  // Normalize the address to lowercase for case-insensitive lookup
  const normalizedAddress = normalizeAddress(address, AddressStringFormat.Lowercase)
  const matchingKey = Object.keys(addressDetails).find(
    (key) => normalizeAddress(key, AddressStringFormat.Lowercase) === normalizedAddress,
  )

  return matchingKey ? addressDetails[matchingKey]?.contract_name : undefined
}
