import { Trans } from 'react-i18next'
import { Flex, Text, useMedia } from 'ui/src'

export const DetectedBadge = () => {
  const media = useMedia()

  return (
    <Flex
      {...(media.xxs && {
        display: 'none',
      })}
    >
      <Text lineHeight={16} fontSize={12} color="$neutral2">
        <Trans i18nKey="common.detected" />
      </Text>
    </Flex>
  )
}
