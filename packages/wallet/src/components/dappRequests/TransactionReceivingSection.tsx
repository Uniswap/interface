import { useTranslation } from 'react-i18next'
import { Flex } from 'ui/src'
import { ReceiveAlt } from 'ui/src/components/icons'
import { TransactionAssetList } from 'wallet/src/components/dappRequests/TransactionAssetList'
import { type TransactionAsset, TransactionRiskLevel } from 'wallet/src/features/dappRequests/types'

interface TransactionReceivingSectionProps {
  assets: TransactionAsset[]
  riskLevel?: TransactionRiskLevel
}

export function TransactionReceivingSection({ assets }: TransactionReceivingSectionProps): JSX.Element {
  const { t } = useTranslation()

  return (
    <Flex gap="$spacing12" px="$spacing16">
      <TransactionAssetList
        assets={assets}
        icon={ReceiveAlt}
        iconColor="$statusSuccess"
        titleText={t('transaction.status.receive.pending')}
        showUsdValue={true}
      />
    </Flex>
  )
}
