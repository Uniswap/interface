import { type ColorTokens, Flex } from '@universe/mycelium'
import { ApproveAlt } from '@universe/mycelium/icons/ApproveAlt'
import { Clear } from '@universe/mycelium/icons/Clear'
import type { TFunction } from 'i18next'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { LocalizationContextState } from 'uniswap/src/features/language/LocalizationContext'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { shortenAddress } from 'utilities/src/addresses'
import { NumberType } from 'utilities/src/format/types'
import { TransactionAssetList } from 'wallet/src/components/dappRequests/TransactionAssetList'
import {
  TransactionApprovalAction,
  TransactionApprovalScope,
  type TransactionAsset,
  TransactionRiskLevel,
} from 'wallet/src/features/dappRequests/types'
import { UNLIMITED_APPROVAL_AMOUNT } from 'wallet/src/features/dappRequests/utils/blockaidApprovalUtils'

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
  const assetName = asset.symbol || asset.name || shortenAddress({ address: asset.address }) || t('common.unknown')

  if (asset.approvalScope === TransactionApprovalScope.Collection) {
    return t('dapp.request.approve.allItems', { assetName })
  }

  if (asset.approvalScope === TransactionApprovalScope.SingleToken && asset.tokenId) {
    return t('dapp.request.approve.token', { assetName, tokenId: asset.tokenId })
  }

  if (asset.amount === UNLIMITED_APPROVAL_AMOUNT) {
    const displayAmount = t('transaction.amount.unlimited')
    return `${displayAmount} ${assetName}`
  }

  // The section title already communicates that a zero allowance is being revoked. Do not hide an
  // explicitly granted amount if malformed or older persisted data reports it as zero.
  if (asset.amount === '0' && getApprovalAction(asset) === TransactionApprovalAction.Revoke) {
    return assetName
  }

  // Format with locale if amount exists
  if (asset.amount) {
    const formattedAmount = formatNumberOrString({
      value: asset.amount,
      type: NumberType.TokenNonTx,
    })
    return `${formattedAmount} ${assetName}`
  }

  // Fallback to symbol/name only
  return assetName
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

  // Keep distinct NFT scopes, token IDs, and actions from collapsing into one row.
  assets.forEach((asset) => {
    const key = [asset.address, asset.chainId, asset.approvalScope, asset.tokenId, asset.approvalAction].join('-')
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

function getApprovalAction(asset: TransactionAsset): TransactionApprovalAction {
  if (!asset.approvalAction) {
    return asset.amount === '0' ? TransactionApprovalAction.Revoke : TransactionApprovalAction.Grant
  }

  switch (asset.approvalAction) {
    case TransactionApprovalAction.Revoke:
    case TransactionApprovalAction.Grant:
    case TransactionApprovalAction.Change:
      return asset.approvalAction
    default:
      return getFallbackApprovalAction(asset.approvalAction)
  }
}

// The `never` parameter makes a new enum member a compile error while retaining a neutral runtime
// fallback for data produced by a newer client or API version.
function getFallbackApprovalAction(_action: never): TransactionApprovalAction {
  return TransactionApprovalAction.Change
}

export function TransactionApprovingSection({ assets, riskLevel }: TransactionApprovingSectionProps): JSX.Element {
  const { t } = useTranslation()
  const { formatNumberOrString } = useLocalizationContext()
  const iconColor = getRiskIconColor(riskLevel)

  // NFT responses do not encode the grant/revoke argument. Keep those visible under a neutral
  // permission-change heading unless the original calldata resolves it. Partition in one pass so
  // every action is routed exactly once; the Record also makes new enum members fail typecheck.
  const groupedAssetsByAction = useMemo(() => {
    const assetsByAction: Record<TransactionApprovalAction, TransactionAsset[]> = {
      [TransactionApprovalAction.Revoke]: [],
      [TransactionApprovalAction.Grant]: [],
      [TransactionApprovalAction.Change]: [],
    }

    assets.forEach((asset) => {
      assetsByAction[getApprovalAction(asset)].push(asset)
    })

    return {
      [TransactionApprovalAction.Revoke]: groupApprovalAssets(assetsByAction[TransactionApprovalAction.Revoke]),
      [TransactionApprovalAction.Grant]: groupApprovalAssets(assetsByAction[TransactionApprovalAction.Grant]),
      [TransactionApprovalAction.Change]: groupApprovalAssets(assetsByAction[TransactionApprovalAction.Change]),
    }
  }, [assets])
  const groupedRevokingAssets = groupedAssetsByAction[TransactionApprovalAction.Revoke]
  const groupedApprovingAssets = groupedAssetsByAction[TransactionApprovalAction.Grant]
  const groupedChangingAssets = groupedAssetsByAction[TransactionApprovalAction.Change]

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
      {groupedChangingAssets.length > 0 && (
        <TransactionAssetList
          assets={groupedChangingAssets.map((g) => g.primaryAsset)}
          groupedAssets={groupedChangingAssets}
          icon={ApproveAlt}
          iconColor={iconColor}
          titleText={t('dapp.request.approve.permissionChange')}
          formatAmount={(asset) => formatAssetDisplay({ asset, t, formatNumberOrString })}
        />
      )}
    </Flex>
  )
}
