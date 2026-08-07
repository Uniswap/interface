import type { ReactNode } from 'react'
import { Flex, Text, TouchableArea } from 'ui/src'

type PermissionedSheetHeaderProps = {
  icon: ReactNode
  title: string
  description: string
  onLearnMore?: () => void
  learnMoreLabel?: string
}

export function PermissionedSheetHeader({
  icon,
  title,
  description,
  onLearnMore,
  learnMoreLabel,
}: PermissionedSheetHeaderProps): JSX.Element {
  return (
    <Flex gap="$spacing16" alignItems="center" width="100%">
      <Flex
        alignItems="center"
        justifyContent="center"
        backgroundColor="$surface3"
        borderRadius="$rounded12"
        width="$spacing48"
        height="$spacing48"
      >
        {icon}
      </Flex>
      <Flex gap="$spacing8" alignItems="center" width="100%">
        <Text variant="subheading1" color="$neutral1" textAlign="center">
          {title}
        </Text>
        <Text variant="body3" color="$neutral2" textAlign="center">
          {description}
        </Text>
        {onLearnMore && learnMoreLabel && (
          <TouchableArea onPress={onLearnMore}>
            <Text variant="buttonLabel3" color="$neutral1">
              {learnMoreLabel}
            </Text>
          </TouchableArea>
        )}
      </Flex>
    </Flex>
  )
}
