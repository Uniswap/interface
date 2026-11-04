import { PositionStatus } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { Flex, Text } from '@universe/mycelium'
import { StatusIndicatorCircle } from '@universe/mycelium/icons/StatusIndicatorCircle'
import { useTranslation } from 'react-i18next'
import { lpStatusConfig } from 'uniswap/src/features/positions/lpStatusConfig'

export function LiquidityPositionStatusIndicator({
  status,
  textVariant = 'body3',
  showStalePriceWarning = false,
}: {
  status: PositionStatus
  textVariant?: 'body3' | 'body4'
  /** Renders the range badge in a warning state; the pool price backing the status may be stale. */
  showStalePriceWarning?: boolean
}): JSX.Element | null {
  const { t } = useTranslation()
  const config = lpStatusConfig[status]

  if (!config) {
    return null
  }

  const showStale =
    showStalePriceWarning && (status === PositionStatus.IN_RANGE || status === PositionStatus.OUT_OF_RANGE)
  const color = showStale ? '$statusWarning' : config.color
  const label = showStale
    ? status === PositionStatus.IN_RANGE
      ? t('position.status.inRange.stalePrice')
      : t('position.status.outOfRange.stalePrice')
    : t(config.i18nKey)

  return (
    <Flex row gap="$spacing6" alignItems="center">
      <StatusIndicatorCircle color={color} />
      <Text variant={textVariant} color={color}>
        {label}
      </Text>
    </Flex>
  )
}
