import type { TFunction } from 'i18next'
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

export function TransactionApprovingSection({ assets, riskLevel }: TransactionApprovingSectionProps): JSX.Element {
  const { t } = useTranslation()
  const { formatNumberOrString } = useLocalizationContext()
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
          formatAmount={(asset) => formatAssetDisplay({ asset, t, formatNumberOrString })}
        />
      )}
      {approvingAssets.length > 0 && (
        <TransactionAssetList
          assets={approvingAssets}
          icon={ApproveAlt}
          iconColor={iconColor}
          titleText={t('common.approving')}
          formatAmount={(asset) => formatAssetDisplay({ asset, t, formatNumberOrString })}
        />
      )}
    </Flex>
  )
}
