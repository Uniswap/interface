import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'

export function PositionFeesUnavailable(): JSX.Element {
  const { t } = useTranslation()

  return (
    <Flex gap="$spacing8" width="100%">
      <Text color="$neutral2" variant="body3">
        {t('common.feesEarned')}
      </Text>
      <Text color="$neutral2" variant="heading3">
        {t('common.unavailable')}
      </Text>
      <Text color="$neutral2" maxWidth={280} variant="body3">
        {t('fee.unavailable')}
      </Text>
    </Flex>
  )
}
