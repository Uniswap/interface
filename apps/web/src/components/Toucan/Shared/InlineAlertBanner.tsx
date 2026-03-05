import { Flex, Text } from 'ui/src'
import { AlertTriangleFilled } from 'ui/src/components/icons/AlertTriangleFilled'
import { InfoCircleFilled } from 'ui/src/components/icons/InfoCircleFilled'

type InlineAlertBannerVariant = 'info' | 'warning'

interface InlineAlertBannerProps {
  title: string
  description: string
  variant?: InlineAlertBannerVariant
}

export function InlineAlertBanner({ title, description, variant = 'info' }: InlineAlertBannerProps): JSX.Element {
  const Icon = variant === 'warning' ? AlertTriangleFilled : InfoCircleFilled

  return (
    <Flex
      row
      alignItems="flex-start"
      gap="$spacing8"
      p="$spacing12"
      backgroundColor="$surface2"
      borderRadius="$rounded12"
    >
      <Flex>
        <Icon color="$neutral2" size="$icon.20" />
      </Flex>
      <Flex flex={1}>
        <Text variant="body3" color="$neutral1">
          {title}
        </Text>
        <Text variant="body3" color="$neutral2">
          {description}
        </Text>
      </Flex>
    </Flex>
  )
}
