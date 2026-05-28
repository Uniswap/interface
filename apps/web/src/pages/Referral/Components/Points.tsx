/* eslint-disable import/no-unused-modules */

import { PointTxList } from 'pages/Referral/Components/TransactionList'
import { useTranslation } from 'react-i18next'
import { Flex, Text, useMedia } from 'ui/src'

type TransactionPoint = {
  txHash: string
  createdAt: string
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 4 }).format(value)
}

export function Points({
  txPoints,
  transactions,
  loading,
}: {
  txPoints: number
  transactions: TransactionPoint[]
  loading: boolean
}) {
  const { t } = useTranslation()
  const media = useMedia()
  const isMobile = media.md

  return (
    <Flex flexDirection="column" gap="$spacing32" width="100%">
      {/* Section 1: Your Transaction Rewards */}
      <Flex flexDirection="column" gap="$spacing16">
        <Text variant="subheading1" color="$neutral1">
          {t('referral.points.tradeRewardsTitle')}
        </Text>
        <Flex
          p="$spacing16"
          borderRadius="$rounded16"
          borderWidth={1}
          borderColor="$surface3"
          backgroundColor="$surface2"
          gap="$spacing4"
          width={isMobile ? '100%' : 'fit-content'}
          minWidth={isMobile ? '100%' : 140}
        >
          <Text variant="body2" color="$neutral2">
            {t('referral.points.txPointsLabel')}
          </Text>
          <Text variant="heading3" color="$neutral1">
            {formatNumber(txPoints)}
          </Text>
        </Flex>
      </Flex>

      {/* Section 2: Transaction Points Details */}
      <Flex flexDirection="column" gap="$spacing16">
        <Text variant="subheading1" color="$neutral1">
          {t('referral.points.tradePointsDetailsTitle')}
        </Text>
        <PointTxList transactions={transactions} loading={loading} />
      </Flex>
    </Flex>
  )
}
