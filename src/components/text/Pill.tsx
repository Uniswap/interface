import React, { ReactNode } from 'react'
import { CenterBox } from 'src/components/layout/CenterBox'
import { Text } from 'src/components/Text'

interface PillProps {
  backgroundColor?: string
  borderColor?: string
  foregroundColor?: string
  icon?: ReactNode
  label: string
}

export function Pill({ backgroundColor, borderColor, foregroundColor, icon, label }: PillProps) {
  return (
    <CenterBox
      backgroundColor="gray200"
      borderColor="none"
      borderRadius="full"
      borderWidth={1}
      px="md"
      py="xs"
      style={{
        backgroundColor: backgroundColor,
        borderColor: borderColor ?? foregroundColor,
      }}>
      {icon && icon}
      <Text variant="body" color="black" style={{ color: foregroundColor }}>
        {label}
      </Text>
    </CenterBox>
  )
}
