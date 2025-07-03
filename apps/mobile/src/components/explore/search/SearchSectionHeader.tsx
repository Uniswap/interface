import React from 'react'
import { Flex, FlexProps, Text, TouchableArea } from 'ui/src'

interface SectionHeaderTextProps {
  title: string
  icon?: JSX.Element
  afterIcon?: JSX.Element
  onPress?: () => void
}

export const SectionHeaderText = ({
  title,
  icon,
  afterIcon,
  onPress,
  ...rest
}: SectionHeaderTextProps & FlexProps): JSX.Element => {
  return (
    <TouchableArea disabled={!onPress} onPress={onPress}>
      <Flex row alignItems="center" gap="$spacing4" mb="$spacing4" mx="$spacing20" {...rest}>
        {icon && icon}
        <Text color="$neutral2" pl={icon ? '$spacing4' : '$none'} variant="subheading2">
          {title}
        </Text>
        {afterIcon && afterIcon}
      </Flex>
    </TouchableArea>
  )
}
