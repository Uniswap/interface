import { Alignment, Fit, Layout, useRive } from '@rive-app/react-canvas'
import { useEffect, useState } from 'react'
import { Flex } from 'ui/src'

interface RiveAnimationProps {
  isDarkMode: boolean
}

export default function RiveAnimation({ isDarkMode }: RiveAnimationProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const { rive: lightAnimation, RiveComponent: LightAnimation } = useRive({
    src: '/rive/landing-page.riv',
    artboard: 'Mobile-Light',
    stateMachines: 'Animation',
    layout: new Layout({ fit: Fit.Contain, alignment: Alignment.BottomCenter }),
    autoplay: mounted,
  })

  const { rive: darkAnimation, RiveComponent: DarkAnimation } = useRive({
    src: '/rive/landing-page.riv',
    artboard: 'Mobile-Dark',
    stateMachines: 'Animation',
    layout: new Layout({ fit: Fit.Contain, alignment: Alignment.BottomCenter }),
    autoplay: mounted,
  })

  if (!mounted) {
    return null
  }

  return (
    <Flex width="100%" height="60%" position="absolute" m="auto" bottom={0} zIndex={1}>
      {isDarkMode ? (
        <DarkAnimation onMouseEnter={() => darkAnimation?.play()} />
      ) : (
        <LightAnimation onMouseEnter={() => lightAnimation?.play()} />
      )}
    </Flex>
  )
}
