import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics'
import { PropsWithChildren, useEffect, useState } from 'react'
import { Flex, FlexProps } from 'ui/src'

export const AnimateInOrder = ({
  children,
  index,
  animation = 'bouncy',
  enterStyle = { opacity: 0, scale: 0.8 },
  exitStyle = { opacity: 0, scale: 0.8 },
  delayMs = 150,
  hapticOnEnter,
  ...rest
}: PropsWithChildren<
  {
    index: number
    hapticOnEnter?: boolean
    delayMs?: number
  } & Pick<FlexProps, 'animation' | 'enterStyle' | 'exitStyle'> &
    FlexProps
>): JSX.Element => {
  return (
    <Delay by={index * delayMs} hapticOnEnter={hapticOnEnter}>
      <Flex
        key={`animate-${index}`}
        animation={animation}
        enterStyle={enterStyle}
        exitStyle={exitStyle}
        {...rest}>
        {children}
      </Flex>
    </Delay>
  )
}

const Delay = ({
  children,
  hapticOnEnter,
  by,
}: PropsWithChildren<{ by: number; hapticOnEnter?: boolean }>): JSX.Element | null => {
  const [done, setDone] = useState(false)

  useEffect(() => {
    const showTimer = setTimeout(async () => {
      if (hapticOnEnter) {
        await impactAsync(ImpactFeedbackStyle.Light)
      }
      setDone(true)
    }, by)
    return () => clearTimeout(showTimer)
  }, [by, hapticOnEnter])

  return done ? <>{children}</> : null
}
