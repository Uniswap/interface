import { PositionStatus } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { lpStatusConfig } from 'components/Liquidity/constants'
import { TextLoader } from 'components/Liquidity/Loader'
import { Trans } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { StatusIndicatorCircle } from 'ui/src/components/icons/StatusIndicatorCircle'

export function LiquidityPositionStatusIndicatorLoader() {
  return (
    <Flex row gap="$spacing6" alignItems="center">
      <StatusIndicatorCircle color="$surface3" />
      <TextLoader variant="body3" width={100} />
    </Flex>
  )
}

export function LiquidityPositionStatusIndicator({ status }: { status: PositionStatus }) {
  const config = lpStatusConfig[status]

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
