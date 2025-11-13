import { PositionStatus } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { PositionInfo } from 'components/Liquidity/types'
import { TFunction } from 'i18next'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { ColorTokens, Flex, Text } from 'ui/src'

const getStatusText = (status: PositionStatus, t: TFunction) => {
  switch (status) {
    case PositionStatus.IN_RANGE:
      return t('common.withinRange')
    case PositionStatus.OUT_OF_RANGE:
      return t('common.outOfRange')
    case PositionStatus.CLOSED:
      return t('common.closed')
    default:
      return t('common.unknown')
  }
}

const getStatusColor = (status: PositionStatus): ColorTokens => {
  switch (status) {
    case PositionStatus.IN_RANGE:
      return '$statusSuccess'
    case PositionStatus.OUT_OF_RANGE:
      return '$statusWarning'
    case PositionStatus.CLOSED:
      return '$neutral2'
    default:
      return '$neutral2'
  }
}

const getBackgroundColor = (status: PositionStatus): ColorTokens => {
  switch (status) {
    case PositionStatus.IN_RANGE:
      return '$statusSuccess2'
    case PositionStatus.OUT_OF_RANGE:
      return '$statusWarning2'
    case PositionStatus.CLOSED:
      return '$surface3'
    default:
      return '$surface3'
  }
}

// Second column cell component - Status (in range or out of range)
export const PoolStatusCell = memo(function PoolStatusCell({ position }: { position: PositionInfo }) {
  const { t } = useTranslation()

  return (
    <Flex py="$spacing2" px="$spacing8" borderRadius="$rounded8" backgroundColor={getBackgroundColor(position.status)}>
      <Text variant="body3" color={getStatusColor(position.status)}>
        {getStatusText(position.status, t)}
      </Text>
    </Flex>
  )
})
PoolStatusCell.displayName = 'PoolStatusCell'
