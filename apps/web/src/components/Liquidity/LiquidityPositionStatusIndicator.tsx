// eslint-disable-next-line no-restricted-imports
import { PositionStatus } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { Flex, Text } from 'ui/src'
import { StatusIndicatorCircle } from 'ui/src/components/icons/StatusIndicatorCircle'
import { Trans } from 'uniswap/src/i18n'

const statusConfig = {
  [PositionStatus.IN_RANGE]: {
    color: '$statusSuccess',
    i18nKey: 'common.withinRange',
  },
  [PositionStatus.OUT_OF_RANGE]: {
    color: '$statusCritical',
    i18nKey: 'common.outOfRange',
  },
  [PositionStatus.CLOSED]: {
    color: '$neutral2',
    i18nKey: 'common.closed',
  },
  [PositionStatus.UNSPECIFIED]: undefined,
}

export function LiquidityPositionStatusIndicator({ status }: { status: PositionStatus }) {
  const config = statusConfig[status]

  if (!config) {
    return null
  }

  return (
    <Flex row gap="$spacing6" alignItems="center">
      <StatusIndicatorCircle color={config.color} />
      <Text variant="body3" color={config.color}>
        <Trans i18nKey={config.i18nKey} />
      </Text>
    </Flex>
  )
}
