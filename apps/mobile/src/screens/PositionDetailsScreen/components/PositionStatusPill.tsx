import { PositionStatus } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import type { ColorTokens } from 'ui/src'
import { lpStatusConfig } from 'uniswap/src/features/positions/lpStatusConfig'

const statusBackgroundColor: Record<PositionStatus, ColorTokens | undefined> = {
  [PositionStatus.IN_RANGE]: '$statusSuccess2',
  [PositionStatus.OUT_OF_RANGE]: '$statusCritical2',
  [PositionStatus.CLOSED]: '$surface3',
  [PositionStatus.UNSPECIFIED]: undefined,
}

export function PositionStatusPill({ status }: { status: PositionStatus }): JSX.Element | null {
  const { t } = useTranslation()
  const config = lpStatusConfig[status]

  if (!config) {
    return null
  }

  return (
    <Flex
      backgroundColor={statusBackgroundColor[status]}
      borderColor={statusBackgroundColor[status]}
      borderRadius={10}
      borderWidth={1}
      px="$spacing12"
      py="$spacing2"
    >
      <Text color={config.color} variant="body2">
        {t(config.i18nKey)}
      </Text>
    </Flex>
  )
}
