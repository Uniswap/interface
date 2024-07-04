import { PropsWithChildren } from 'react'
import type { ViewStyle } from 'react-native'
import { Flex } from 'ui/src/components/layout'

export type HiddenFromScreenReadersProps = PropsWithChildren<{
  style?: ViewStyle
}>

export function HiddenFromScreenReaders({ children, style }: HiddenFromScreenReadersProps): JSX.Element {
  // TODO(MOB-1533) Make hidden from screen reader functionality work with web too
  return <Flex style={style}>{children}</Flex>
}
