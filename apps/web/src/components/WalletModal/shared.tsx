import { useTranslation } from 'react-i18next'
import { Flex, Text, useMedia } from 'ui/src'

export const DetectedBadge = () => {
  const { t } = useTranslation()
  const media = useMedia()

  return (
    <Flex
      {...(media.xxs && {
        display: 'none',
      })}
    >
      <Text lineHeight={16} fontSize={12} color="$neutral2">
        {t('common.detected')}
      </Text>
    </Flex>
  )
}
