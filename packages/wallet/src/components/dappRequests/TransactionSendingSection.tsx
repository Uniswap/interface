import { useTranslation } from 'react-i18next'
import { Flex } from 'ui/src'
import { SendAlt } from 'ui/src/components/icons'
import { TransactionAssetList } from 'wallet/src/components/dappRequests/TransactionAssetList'
import { type TransactionAsset, TransactionRiskLevel } from 'wallet/src/features/dappRequests/types'

interface TransactionSendingSectionProps {
  assets: TransactionAsset[]
  riskLevel?: TransactionRiskLevel
}

export function TransactionSendingSection({ assets }: TransactionSendingSectionProps): JSX.Element {
  const { t } = useTranslation()

  return (
    <Flex gap="$spacing12" px="$spacing16">
      <TransactionAssetList
        assets={assets}
        icon={SendAlt}
        iconColor="$statusCritical"
        titleText={t('walletConnect.request.details.label.sending')}
        showUsdValue={true}
      />
    </Flex>
  )
}
