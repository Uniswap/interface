import React, { ReactNode } from 'react'
import { Flex, FlexProps } from 'src/components/layout'
import { Text } from 'src/components/Text'

type PillProps = {
  customBackgroundColor?: string
  customBorderColor?: string
  foregroundColor?: string
  icon?: ReactNode
  label?: ReactNode
} & FlexProps

export function Pill({
  customBackgroundColor,
  children,
  customBorderColor,
  borderRadius = 'full',
  foregroundColor,
  flexDirection = 'row',
  icon,
  label,
  px = 'sm',
  py = 'xs',
  ...rest
}: PillProps) {
  return (
    <Flex
      alignItems="center"
      backgroundColor="gray200"
      borderColor="none"
      borderRadius={borderRadius}
      borderWidth={1}
      flexDirection={flexDirection}
      gap="xs"
      justifyContent="center"
      px={px}
      py={py}
      style={{
        ...(customBackgroundColor ? { backgroundColor: customBackgroundColor } : {}),
        ...(customBorderColor ? { borderColor: customBorderColor } : {}),
      }}
      {...rest}>
      {icon ?? null}
      {label ? (
        <Text style={{ color: foregroundColor }} variant="bodyMd">
          {label}
        </Text>
      ) : null}
      {children}
    </Flex>
  )
}
