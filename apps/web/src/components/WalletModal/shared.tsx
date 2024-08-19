import { Flex, Text, useMedia } from 'ui/src'
import { Trans } from 'uniswap/src/i18n'

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
