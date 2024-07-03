import { PropsWithChildren } from 'react'
import { GetProps } from 'tamagui'
import { LinearGradientProps } from 'tamagui/linear-gradient'
import { Text } from 'ui/src/components/text'

export type GradientTextProps = PropsWithChildren<GetProps<typeof Text> & { gradient: LinearGradientProps }>

// TODO(WEB-4313): Implement GradientText for web
export function GradientText({ children, ...props }: GradientTextProps): JSX.Element {
  return <Text {...props}>{children}</Text>
}
