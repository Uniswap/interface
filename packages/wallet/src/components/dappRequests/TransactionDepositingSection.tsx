import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { ArrowDownToLine, TrendUp } from 'ui/src/components/icons'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { TransactionAssetList } from 'wallet/src/components/dappRequests/TransactionAssetList'
import type { TransactionAsset } from 'wallet/src/features/dappRequests/types'

interface TransactionDepositingSectionProps {
  assets: TransactionAsset[]
  apyPercent?: number
}

export function TransactionDepositingSection({ assets, apyPercent }: TransactionDepositingSectionProps): JSX.Element {
  const { t } = useTranslation()
  const { formatPercent } = useLocalizationContext()

  return (
    <Flex gap="$spacing12" px="$spacing16">
      <TransactionAssetList
        assets={assets}
        icon={ArrowDownToLine}
        iconColor="$neutral2"
        titleText={t('transaction.status.deposit.pending')}
        showUsdValue={true}
      />
      {apyPercent !== undefined && (
        <Flex row alignItems="center" justifyContent="space-between">
          <Flex row gap="$spacing8" alignItems="center">
            <TrendUp color="$accent1" size="$icon.16" />
            <Text color="$neutral2" variant="body3">
              {t('home.earning.title')}
            </Text>
          </Flex>
          <Text color="$accent1" variant="body3">
            {t('explore.earn.apy', { apy: formatPercent(apyPercent) })}
          </Text>
        </Flex>
      )}
    </Flex>
  )
}
