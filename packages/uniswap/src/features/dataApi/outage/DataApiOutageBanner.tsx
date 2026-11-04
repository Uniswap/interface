import { isWebApp } from '@universe/environment'
import { Flex, Text, TouchableArea } from '@universe/mycelium'
import type { SporeColorToken } from '@universe/mycelium/compat'
import { AlertTriangleFilled } from '@universe/mycelium/icons/AlertTriangleFilled'
import { useTranslation } from 'react-i18next'

type DataApiOutageBannerProps = {
  onPress?: () => void
  title?: string
  /** Only the tokens the compat primitives resolve; every other `$` colour throws at render. */
  backgroundColor?: SporeColorToken
}

export function DataApiOutageBanner({
  title,
  onPress,
  backgroundColor = '$surface2',
}: DataApiOutageBannerProps): JSX.Element {
  const { t } = useTranslation()

  const content = (
    <Flex
      row
      alignItems="center"
      backgroundColor={backgroundColor}
      borderRadius={isWebApp ? '$rounded12' : undefined}
      gap="$spacing12"
      px="$spacing16"
      py="$spacing12"
      mb="$spacing12"
    >
      <AlertTriangleFilled color="$neutral2" size="$icon.16" />
      <Flex flex={1}>
        <Text variant="body3" color="$neutral2">
          {title ?? t('dataApi.outage.banner.title')}
        </Text>
      </Flex>
    </Flex>
  )

  if (!onPress) {
    return content
  }

  return <TouchableArea onPress={onPress}>{content}</TouchableArea>
}
