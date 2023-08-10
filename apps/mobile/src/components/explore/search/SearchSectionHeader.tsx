import React from 'react'
import { Flex } from 'src/components/layout'
import { Text, TextProps } from 'src/components/Text'

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
    <Flex row alignItems="center" gap="spacing12" mb="spacing4" mx="spacing4" {...rest}>
      {icon && icon}
      <Text color="neutral2" variant="subheadSmall">
        {title}
      </Text>
    </Flex>
  )
}
