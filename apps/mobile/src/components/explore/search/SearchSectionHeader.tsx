import React from 'react'
import { Flex, Text, TextProps } from 'ui/src'

interface SectionHeaderTextProps {
  title: string
  icon?: JSX.Element
}

export const SectionHeaderText = ({
  title,
  icon,
  ...rest
}: SectionHeaderTextProps & TextProps): JSX.Element => {
  return (
    <Flex row alignItems="center" gap="$spacing8" mb="$spacing4" mx="$spacing4" {...rest}>
      {icon && icon}
      <Text color="$neutral2" variant="subheading2">
        {title}
      </Text>
    </Flex>
  )
}
