import { PropsWithChildren, useEffect, useState } from 'react'
import { Flex, FlexProps } from 'ui/src/components/layout'

export const AnimateInOrder = ({
  children,
  index,
  animation = 'bouncy',
  enterStyle = { opacity: 0, scale: 0.8 },
  exitStyle = { opacity: 0, scale: 0.8 },
  delayMs = 150,
  ...rest
}: PropsWithChildren<
  {
    index: number
    delayMs?: number
  } & Pick<FlexProps, 'animation' | 'enterStyle' | 'exitStyle'> &
    FlexProps
>): JSX.Element => {
  return (
    <Delay by={index * delayMs}>
      <Flex key={`animate-${index}`} animation={animation} enterStyle={enterStyle} exitStyle={exitStyle} {...rest}>
        {children}
      </Flex>
    </Delay>
  )
}

const Delay = ({ children, by }: PropsWithChildren<{ by: number }>): JSX.Element | null => {
  const [done, setDone] = useState(false)

  useEffect(() => {
    const showTimer = setTimeout(async () => {
      setDone(true)
    }, by)
    return () => clearTimeout(showTimer)
  }, [by])

  return done ? <>{children}</> : null
}
