import React from 'react'
import { BackButton } from 'src/components/buttons/BackButton'
import { Flex, Text, TouchableArea } from 'ui/src'
import { iconSizes } from 'ui/src/theme'

export function HeaderRow({
  headingText,
  tooltipButton,
}: {
  headingText?: string
  tooltipButton?: JSX.Element
}): JSX.Element {
  return (
    <Flex row alignItems="center" justifyContent="space-between" mx="$spacing4">
      <TouchableArea borderRadius="$roundedFull" opacity={0.8} p="$spacing8">
        <Flex centered grow height={iconSizes.icon16} width={iconSizes.icon16}>
          <BackButton />
        </Flex>
      </TouchableArea>
      {headingText && (
        <Text textAlign="center" variant="subheading1">
          {headingText}
        </Text>
      )}
      {tooltipButton}
    </Flex>
  )
}
