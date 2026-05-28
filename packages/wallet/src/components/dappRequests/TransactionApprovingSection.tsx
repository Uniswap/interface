import type { TFunction } from 'i18next'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { type ColorTokens, Flex } from 'ui/src'
import { ApproveAlt, Clear } from 'ui/src/components/icons'
import type { LocalizationContextState } from 'uniswap/src/features/language/LocalizationContext'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'
import { TransactionAssetList } from 'wallet/src/components/dappRequests/TransactionAssetList'
import { type TransactionAsset, TransactionRiskLevel } from 'wallet/src/features/dappRequests/types'
import { UNLIMITED_APPROVAL_AMOUNT } from 'wallet/src/features/dappRequests/utils/blockaidUtils'

interface TransactionApprovingSectionProps {
  assets: TransactionAsset[]
  riskLevel: TransactionRiskLevel
}

/**
 * Determines the icon color based on transaction risk level
 * @param riskLevel - The risk level of the transaction
 * @returns Color token for the icon
 */
export function getRiskIconColor(riskLevel: TransactionRiskLevel): ColorTokens {
  return riskLevel === TransactionRiskLevel.Critical ? '$statusCritical' : '$statusSuccess'
}

interface FormatAssetDisplayParams {
  asset: TransactionAsset
  t: TFunction
  formatNumberOrString: LocalizationContextState['formatNumberOrString']
}

/**
 * Formats asset display string with amount and symbol using locale-specific number formatting
 * @param params - Object containing asset, translation function, and locale formatter
 * @returns Formatted asset display string
 */
export function formatAssetDisplay({ asset, t, formatNumberOrString }: FormatAssetDisplayParams): string {
  // Handle special cases: unlimited or zero (revoke)
  if (asset.amount === UNLIMITED_APPROVAL_AMOUNT || asset.amount === '0') {
    const displayAmount = t('transaction.amount.unlimited')
    return `${displayAmount} ${asset.symbol ?? asset.name ?? ''}`
  }

  // Format with locale if amount exists
  if (asset.amount) {
    const formattedAmount = formatNumberOrString({
      value: asset.amount,
      type: NumberType.TokenNonTx,
    })
    return `${formattedAmount} ${asset.symbol ?? asset.name ?? ''}`
  }

  // Fallback to symbol/name only
  return asset.symbol ?? asset.name ?? ''
}

/**
 * Grouped asset data for displaying multiple approvals of the same token
 */
export interface GroupedApprovalAsset {
  /** The primary asset with the highest approval amount */
  primaryAsset: TransactionAsset
  /** All assets in this group (including the primary) */
  allAssets: TransactionAsset[]
}

/**
 * Groups approval assets by token (address + chainId) and selects highest amount for display
 * @param assets - Array of approval assets
 * @returns Array of grouped assets or ungrouped single assets
 */
function groupApprovalAssets(assets: TransactionAsset[]): GroupedApprovalAsset[] {
  const groups: Record<string, TransactionAsset[]> = {}

  // Group by token (address + chainId)
  assets.forEach((asset) => {
    const key = `${asset.address}-${asset.chainId}`
    const existing = groups[key]
    if (existing) {
      existing.push(asset)
    } else {
      groups[key] = [asset]
    }
  })

  // For each token group, select the asset with the highest approval amount across all spenders
  return Object.values(groups).map((groupAssets) => {
    // groupAssets is guaranteed to be non-empty due to how groups are built
    let primaryAsset = (groupAssets as [TransactionAsset, ...TransactionAsset[]])[0]

    if (groupAssets.length > 1) {
      // Find the spender requesting the highest approval amount for this token
      for (const asset of groupAssets) {
        const primaryAmount = primaryAsset.amount
        const currentAmount = asset.amount

        // Unlimited is always highest, no need to check further
        if (currentAmount === UNLIMITED_APPROVAL_AMOUNT) {
          primaryAsset = asset
          break
        }

        // Compare numeric amounts
        if (primaryAmount && currentAmount) {
          const primaryNum = parseFloat(primaryAmount)
          const currentNum = parseFloat(currentAmount)
          if (!isNaN(currentNum) && !isNaN(primaryNum) && currentNum > primaryNum) {
            primaryAsset = asset
          }
        }
      }
    }

    return {
      primaryAsset,
      allAssets: groupAssets,
    }
  })
}

export function TransactionApprovingSection({ assets, riskLevel }: TransactionApprovingSectionProps): JSX.Element {
  const { t } = useTranslation()
  const { formatNumberOrString } = useLocalizationContext()
  const iconColor = getRiskIconColor(riskLevel)

  // Group assets by revoking vs approving
  const revokingAssets = assets.filter((asset) => asset.amount === '0')
  const approvingAssets = assets.filter((asset) => asset.amount !== '0')

  // Group revoking assets by token to handle multiple spenders
  const groupedRevokingAssets = useMemo(() => groupApprovalAssets(revokingAssets), [revokingAssets])

  // Group approving assets by token to handle multiple spenders
  const groupedApprovingAssets = useMemo(() => groupApprovalAssets(approvingAssets), [approvingAssets])

  return (
    <Flex gap="$spacing12" px="$spacing16">
      {groupedRevokingAssets.length > 0 && (
        <TransactionAssetList
          assets={groupedRevokingAssets.map((g) => g.primaryAsset)}
          groupedAssets={groupedRevokingAssets}
          icon={Clear}
          iconColor="$statusCritical"
          titleText={t('dapp.request.revoke.action')}
          formatAmount={(asset) => formatAssetDisplay({ asset, t, formatNumberOrString })}
        />
      )}
      {groupedApprovingAssets.length > 0 && (
        <TransactionAssetList
          assets={groupedApprovingAssets.map((g) => g.primaryAsset)}
          groupedAssets={groupedApprovingAssets}
          icon={ApproveAlt}
          iconColor={iconColor}
          titleText={t('common.approving')}
          formatAmount={(asset) => formatAssetDisplay({ asset, t, formatNumberOrString })}
        />
      )}
    </Flex>
  )
}
