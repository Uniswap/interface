import { useTranslation } from 'react-i18next'
import { Flex, Text, TouchableArea } from 'ui/src'
import { AlertTriangleFilled } from 'ui/src/components/icons/AlertTriangleFilled'
import { isWebApp } from 'utilities/src/platform'

type DataApiOutageBannerProps = {
  onPress?: () => void
  title?: string
}

export function DataApiOutageBanner({ title, onPress }: DataApiOutageBannerProps): JSX.Element {
  const { t } = useTranslation()

  const content = (
    <Flex
      row
      alignItems="center"
      backgroundColor="$surface2"
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
