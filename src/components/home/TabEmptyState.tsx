import React from 'react'
import { ViewStyle } from 'react-native'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'

// Empty State
type TabEmptyStateProps = {
  additionalButtonLabel?: string
  buttonLabel?: string
  description: string
  onPress?: () => void
  onPressAdditional?: () => void
  title?: string
  style?: ViewStyle
}

export function TabEmptyState({
  additionalButtonLabel,
  buttonLabel,
  description,
  onPress,
  onPressAdditional,
  title,
  style,
}: TabEmptyStateProps) {
  return (
    <Flex centered gap="sm" m="sm" style={style} width="100%">
      {title && (
        <Text textAlign="center" variant="subheadLarge">
          {title}
        </Text>
      )}
      <Text color="textSecondary" textAlign="center" variant="caption_deprecated">
        {description}
      </Text>
      {buttonLabel && (
        <PrimaryButton
          borderColor="backgroundOutline"
          borderRadius="md"
          label={buttonLabel}
          textVariant="buttonLabelSmall"
          variant="transparent"
          onPress={onPress}
        />
      )}
      {additionalButtonLabel && (
        <PrimaryButton
          borderColor="backgroundOutline"
          borderRadius="md"
          label={additionalButtonLabel}
          textVariant="buttonLabelSmall"
          variant="transparent"
          onPress={onPressAdditional}
        />
      )}
    </Flex>
  )
}
