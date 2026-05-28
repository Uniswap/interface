import { PositionStatus } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { StatusIndicatorCircle } from 'ui/src/components/icons/StatusIndicatorCircle'
import { lpStatusConfig } from '~/features/Liquidity/constants'
import { TextLoader } from '~/features/Liquidity/Loader'

export function LiquidityPositionStatusIndicatorLoader() {
  return (
    <Flex row gap="$spacing6" alignItems="center">
      <StatusIndicatorCircle color="$surface3" />
      <TextLoader variant="body3" width={100} />
    </Flex>
  )
}

export function LiquidityPositionStatusIndicator({ status }: { status: PositionStatus }) {
  const { t } = useTranslation()
  const config = lpStatusConfig[status]

  if (!config) {
    return null
  }

  return (
    <Flex row gap="$spacing6" alignItems="center">
      <StatusIndicatorCircle color={config.color} />
      <Text variant="body3" color={config.color}>
        {t(config.i18nKey)}
      </Text>
    </Flex>
  )
}
