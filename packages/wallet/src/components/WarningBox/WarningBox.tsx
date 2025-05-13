import { Flex, Text } from 'ui/src'
import { AlertTriangleFilled } from 'ui/src/components/icons/AlertTriangleFilled'
import { iconSizes } from 'ui/src/theme'

type WarningBoxProps = {
  level: 'warning' | 'critical'
  message: string
}

export function WarningBox({ level, message }: WarningBoxProps): JSX.Element {
  const iconColor = level === 'critical' ? '$statusCritical' : '$statusWarning'
  const backgroundColor = level === 'critical' ? '$statusCritical2' : '$statusWarning2'
  return (
    <Flex
      row
      alignItems="center"
      backgroundColor={backgroundColor}
      gap="$spacing8"
      px="$spacing12"
      py="$spacing8"
      borderRadius="$rounded12"
      my="$spacing8"
    >
      <Flex height="$spacing24" width="$spacing24">
        <AlertTriangleFilled color={iconColor} size={iconSizes.icon24} />
      </Flex>
      <Text color="$neutral1" variant="body3" flex={1}>
        {message}
      </Text>
    </Flex>
  )
}
