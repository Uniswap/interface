import { Box as InkBox, Text } from 'ink'
import type { ReactNode } from 'react'

interface BoxProps {
  children: ReactNode
  title?: string
  borderColor?: string
  padding?: number
}

export function Box({ children, title, borderColor, padding = 1 }: BoxProps): JSX.Element {
  return (
    <InkBox borderStyle="single" borderColor={borderColor} padding={padding} flexDirection="column">
      {title && <Text bold>{title}</Text>}
      {children}
    </InkBox>
  )
}
