import { PropsWithChildren } from 'react'
import { Text, TextProps } from 'ui/src'

export const TableText = ({ children, ...props }: PropsWithChildren<TextProps>) => {
  return (
    <Text color="$neutral1" variant="body2" {...props}>
      {children}
    </Text>
  )
}

export const EllipsisText = ({ children, ...props }: PropsWithChildren<TextProps>) => {
  return (
    <TableText {...props} whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis">
      {children}
    </TableText>
  )
}
