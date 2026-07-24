import { PositionStatus } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { PositionStatusPill } from 'src/screens/PositionDetailsScreen/components/PositionStatusPill'
import { Flex, Text } from 'ui/src'

interface PositionDetailsStatsProps {
  status: PositionStatus
  isV2: boolean
  minPrice: string
  maxPrice: string
  marketPrice: string
  aprText?: string
}

function StatRow({ label, value }: { label: string; value: ReactNode }): JSX.Element {
  return (
    <Flex row alignItems="center" gap="$spacing8" justifyContent="space-between">
      <Text color="$neutral2" variant="body1">
        {label}
      </Text>
      {typeof value === 'string' ? (
        <Text color="$neutral1" variant="body1">
          {value}
        </Text>
      ) : (
        value
      )}
    </Flex>
  )
}

export function PositionDetailsStats({
  status,
  isV2,
  minPrice,
  maxPrice,
  marketPrice,
  aprText,
}: PositionDetailsStatsProps): JSX.Element {
  const { t } = useTranslation()

  return (
    <Flex gap="$spacing12" width="100%">
      <StatRow label={t('common.status')} value={<PositionStatusPill status={status} />} />
      {isV2 ? (
        <StatRow label={t('common.range')} value={t('common.fullRange')} />
      ) : (
        <>
          <StatRow label={t('common.min')} value={minPrice} />
          <StatRow label={t('common.max')} value={maxPrice} />
          <StatRow label={t('common.market.label')} value={marketPrice} />
        </>
      )}
      {aprText ? <StatRow label={t('pool.apr')} value={aprText} /> : null}
    </Flex>
  )
}
