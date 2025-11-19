import type { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'
import { type ColorTokens, Flex } from 'ui/src'
import { Approve, Clear } from 'ui/src/components/icons'
import { TransactionAssetList } from 'wallet/src/components/dappRequests/TransactionAssetList'
import { UNLIMITED_APPROVAL_AMOUNT } from 'wallet/src/features/dappRequests/transactionUtils'
import { type TransactionAsset, TransactionRiskLevel } from 'wallet/src/features/dappRequests/types'

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

/**
 * Formats asset display string with amount and symbol
 * @param asset - The transaction asset to format
 * @param t - Translation function
 * @returns Formatted asset display string
 */
export function formatAssetDisplay(asset: TransactionAsset, t: TFunction): string {
  const displayAmount =
    asset.amount === UNLIMITED_APPROVAL_AMOUNT || asset.amount === '0'
      ? t('transaction.amount.unlimited')
      : asset.amount

  return displayAmount ? `${displayAmount} ${asset.symbol ?? asset.name ?? ''}` : (asset.symbol ?? asset.name ?? '')
}

export function TransactionApprovingSection({ assets, riskLevel }: TransactionApprovingSectionProps): JSX.Element {
  const { t } = useTranslation()
  const iconColor = getRiskIconColor(riskLevel)

  // Group assets by revoking vs approving
  const revokingAssets = assets.filter((asset) => asset.amount === '0')
  const approvingAssets = assets.filter((asset) => asset.amount !== '0')

  return (
    <Flex gap="$spacing12" px="$spacing16">
      {revokingAssets.length > 0 && (
        <TransactionAssetList
          assets={revokingAssets}
          icon={Clear}
          iconColor="$statusCritical"
          titleText={t('dapp.request.revoke.action')}
          formatAmount={(asset) => formatAssetDisplay(asset, t)}
        />
      )}
      {approvingAssets.length > 0 && (
        <TransactionAssetList
          assets={approvingAssets}
          icon={Approve}
          iconColor={iconColor}
          titleText={t('common.approving')}
          formatAmount={(asset) => formatAssetDisplay(asset, t)}
        />
      )}
    </Flex>
  )
}
