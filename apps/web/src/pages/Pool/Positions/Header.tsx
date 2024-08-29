import { Flex, Text } from 'ui/src'
import { useTranslation } from 'uniswap/src/i18n'

export function PositionsHeader() {
  const { t } = useTranslation()
  return (
    <Flex gap={20}>
      <Text variant="heading2">{t('pool.positions.title')}</Text>
    </Flex>
  )
}
