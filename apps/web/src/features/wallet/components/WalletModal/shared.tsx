import { Flex, Text } from '@universe/mycelium'
import { useMedia } from '@universe/mycelium/theme-hooks-compat'
import { useTranslation } from 'react-i18next'

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
