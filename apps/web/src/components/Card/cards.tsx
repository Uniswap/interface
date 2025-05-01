import { PropsWithChildren } from 'react'
import { Flex, FlexProps, useSporeColors } from 'ui/src'

const Card = ({ children, ...rest }: PropsWithChildren<FlexProps>) => {
  return (
    <Flex width="100%" padding="1rem" borderRadius="$rounded12" {...rest}>
      {children}
    </Flex>
  )
}
export default Card

export const LightCard = ({ children, ...rest }: PropsWithChildren<FlexProps>) => {
  return (
    <Card backgroundColor="$surface2" borderWidth={1} borderColor="$surface3" {...rest}>
      {children}
    </Card>
  )
}

export const DarkGrayCard = ({ children, ...rest }: PropsWithChildren<FlexProps>) => {
  return (
    <Card backgroundColor="$surface3" {...rest}>
      {children}
    </Card>
  )
}

export const OutlineCard = ({ children, ...rest }: PropsWithChildren<FlexProps>) => {
  return (
    <Card backgroundColor="$surface2" borderWidth={1} borderColor="$surface3" {...rest}>
      {children}
    </Card>
  )
}

export const YellowCard = ({ children, ...rest }: PropsWithChildren<FlexProps>) => {
  const colors = useSporeColors()
  return (
    <Card
      backgroundColor="rgba(243, 132, 30, 0.05)"
      {...rest}
      $platform-web={{
        color: colors.statusWarning.val,
        ...rest['$platform-web'],
      }}
    >
      {children}
    </Card>
  )
}

export const BlueCard = ({ children, ...rest }: PropsWithChildren<FlexProps>) => {
  const colors = useSporeColors()
  return (
    <Card
      backgroundColor="$accent2"
      {...rest}
      $platform-web={{
        color: colors.accent1.val,
        ...rest['$platform-web'],
      }}
    >
      {children}
    </Card>
  )
}
